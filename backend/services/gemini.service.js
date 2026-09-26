import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { RunnableBranch, RunnableLambda, RunnableSequence } from '@langchain/core/runnables';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const gemini = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;
const qdrant = process.env.QDRANT_URL
    ? new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY || undefined })
    : null;
const collectionName = process.env.QDRANT_COLLECTION || 'vaccination_knowledge';
const embeddingModel = 'text-embedding-004';

async function createEmbedding(text) {
    if (!gemini) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = gemini.getGenerativeModel({ model: embeddingModel });
    const result = await model.embedContent(text);

    return result.embedding.values;
}

async function ensureCollection() {
    if (!qdrant) {
        throw new Error('QDRANT_URL is not configured');
    }

    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((collection) => collection.name === collectionName);

    if (!exists) {
        await qdrant.createCollection(collectionName, {
            vectors: { size: 768, distance: 'Cosine' }
        });
    }
}

export async function indexVaccinationDocument(text, metadata = {}) {
    await ensureCollection();

    await qdrant.upsert(collectionName, {
        wait: true,
        points: [{
            id: randomUUID(),
            vector: await createEmbedding(text),
            payload: { text, ...metadata }
        }]
    });
}

export async function retrieveVaccinationContext(query, limit = 5) {
    await ensureCollection();

    const results = await qdrant.search(collectionName, {
        vector: await createEmbedding(query),
        limit,
        with_payload: true
    });

    return results.map((result) => result.payload?.text).filter(Boolean);
}

export async function generateGeminiResponse(prompt) {
    if (!gemini) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);

    return result.response.text();
}

export async function classifyParentQuestion(question) {
    const prompt = `Classify this parent vaccination question.
Return only valid JSON with one intent from this list:
latest_vaccine, overdue_vaccines, upcoming_vaccines, vaccination_history, child_schedule, missed_doses, nearby_centres, appointment, vaccine_availability, general, unknown.
Use personal-data intents for questions about the parent's children. Use general for general vaccination education.

Question: ${question}`;
    const response = await generateGeminiResponse(prompt);
    const json = response.match(/\{[\s\S]*\}/)?.[0];

    try {
        const parsed = JSON.parse(json || '{}');
        const intents = new Set([
            'latest_vaccine', 'overdue_vaccines', 'upcoming_vaccines', 'vaccination_history',
            'child_schedule', 'missed_doses', 'nearby_centres', 'appointment',
            'vaccine_availability', 'general', 'unknown'
        ]);
        return intents.has(parsed.intent) ? parsed.intent : 'unknown';
    } catch {
        return 'unknown';
    }
}

export async function routeParentQuestion(question, parentId, handlers) {
    const intent = await classifyParentQuestion(question);
    const route = RunnableBranch.from([
        [
            (input) => input.intent === 'latest_vaccine',
            new RunnableLambda({ func: ({ parentId }) => handlers.latestVaccine(parentId) })
        ],
        ...['overdue_vaccines', 'missed_doses', 'upcoming_vaccines', 'vaccination_history', 'child_schedule', 'nearby_centres', 'appointment', 'vaccine_availability'].map((intent) => [
            (input) => input.intent === intent,
            new RunnableLambda({ func: ({ parentId }) => handlers[intent](parentId) })
        ]),
        new RunnableLambda({ func: ({ question }) => generateRagResponse(question) })
    ]);

    return route.invoke({ question, parentId, intent });
}

export async function generateRagResponse(query) {
    const ragChain = RunnableSequence.from([
        new RunnableLambda({
            func: async ({ question }) => ({
                question,
                context: await retrieveVaccinationContext(question)
            })
        }),
        new RunnableLambda({
            func: async ({ question, context }) => {
                const prompt = `You are a vaccination information assistant for parents. Answer using only the context below.
If the context does not contain the answer, say that the information is unavailable.
Do not diagnose illness or replace advice from a qualified healthcare professional.

Context:
${context.join('\n\n') || 'No relevant vaccination information was found.'}

Question: ${question}`;

                return generateGeminiResponse(prompt);
            }
        })
    ]);

    return ragChain.invoke({ question: query });
}