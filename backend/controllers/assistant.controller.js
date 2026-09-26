import { routeParentQuestion } from '../services/gemini.service.js';
import pool from '../config/db.js';

const latestVaccineQuestion = /(?:\b(last|latest|most recent|recent)\b.*\b(vaccine|vaccination|dose|immuni[sz]ation)\b|\b(vaccine|vaccination|dose|immuni[sz]ation)\b.*\b(last|latest|most recent|recent)\b)/i;

async function answerLatestVaccine(parentId) {
    const [records] = await pool.query(`
        SELECT c.name AS child_name, v.vaccine_name, r.administered_date
        FROM child_vaccination_records r
        JOIN children c ON c.id = r.child_id
        JOIN vaccine_rules v ON v.id = r.vaccine_rule_id
        WHERE c.parent_id = ?
          AND r.status = 'completed'
          AND r.administered_date IS NOT NULL
        ORDER BY r.administered_date DESC, r.id DESC
        LIMIT 1
    `, [parentId]);

    if (records.length === 0) {
        return 'I could not find a completed vaccination record for your children yet.';
    }

    const record = records[0];
    const date = new Date(record.administered_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `${record.child_name}'s latest recorded vaccine was ${record.vaccine_name}, administered on ${date}.`;
}

async function getParentRecords(parentId, condition = '', order = 'r.due_date ASC') {
    const [records] = await pool.query(`
        SELECT c.name AS child_name, v.vaccine_name, v.dose_number, v.target_disease,
               r.due_date, r.administered_date, r.status,
               centres.name AS centre_name
        FROM child_vaccination_records r
        JOIN children c ON c.id = r.child_id
        JOIN vaccine_rules v ON v.id = r.vaccine_rule_id
        LEFT JOIN centres ON centres.id = r.preferred_centre_id
        WHERE c.parent_id = ? ${condition}
        ORDER BY ${order}
        LIMIT 30
    `, [parentId]);
    return records;
}

function formatRecords(records, emptyMessage) {
    if (records.length === 0) return emptyMessage;
    return records.map((record) => {
        const date = new Date(record.administered_date || record.due_date).toLocaleDateString('en-IN');
        const status = record.status === 'completed' ? `completed on ${date}` : `${record.status}, due ${date}`;
        return `${record.child_name}: ${record.vaccine_name} (dose ${record.dose_number}) - ${status}`;
    }).join('\n');
}

async function answerOverdueVaccines(parentId) {
    return formatRecords(
        await getParentRecords(parentId, `AND r.status = 'overdue'`),
        'No overdue vaccines were found for your children.'
    );
}

async function answerUpcomingVaccines(parentId) {
    return formatRecords(
        await getParentRecords(parentId, `AND r.status = 'pending'`, 'r.due_date ASC'),
        'There are no upcoming vaccine doses recorded for your children.'
    );
}

async function answerVaccinationHistory(parentId) {
    return formatRecords(
        await getParentRecords(parentId, `AND r.status = 'completed'`, 'r.administered_date DESC'),
        'No completed vaccination history was found for your children.'
    );
}

async function answerChildSchedule(parentId) {
    return formatRecords(
        await getParentRecords(parentId, '', 'c.name ASC, r.due_date ASC'),
        'No vaccination schedule was found for your children.'
    );
}

async function answerNearbyCentres() {
    const [centres] = await pool.query(`
        SELECT name, address, phone, working_hours
        FROM centres
        WHERE status = 'approved'
        ORDER BY name ASC
        LIMIT 10
    `);
    if (centres.length === 0) return 'No approved vaccination centres are available right now.';
    return `I found these approved vaccination centres. For distance-based results, use the Nearby Centres page and allow location access.\n${centres.map((centre) => `${centre.name} - ${centre.address} (${centre.phone})`).join('\n')}`;
}

async function answerAppointments(parentId) {
    const records = await getParentRecords(parentId, `AND r.status = 'pending' AND r.preferred_centre_id IS NOT NULL`, 'r.due_date ASC');
    return formatRecords(records, 'No booked vaccination appointment is stored for your children. You can choose a centre or reschedule a dose from the vaccination card.');
}

async function answerVaccineAvailability() {
    const [inventory] = await pool.query(`
        SELECT centres.name AS centre_name, centre_inventory.vaccine_name, centre_inventory.available_doses
        FROM centre_inventory
        JOIN centres ON centres.id = centre_inventory.centre_id
        WHERE centres.status = 'approved' AND centre_inventory.available_doses > 0
        ORDER BY centres.name, centre_inventory.vaccine_name
        LIMIT 30
    `);
    if (inventory.length === 0) return 'No current vaccine stock availability is recorded.';
    return inventory.map((item) => `${item.centre_name}: ${item.vaccine_name} (${item.available_doses} doses)`).join('\n');
}

export async function askParentAssistant(req, res, next) {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Please ask a question with at least 3 characters.'
        });
    }

    try {
        if (latestVaccineQuestion.test(question.trim())) {
            const answer = await answerLatestVaccine(req.user.parentId);
            return res.json({ success: true, answer, source: 'parent-record' });
        }

        const answer = await routeParentQuestion(question.trim(), req.user.parentId, {
            latestVaccine: answerLatestVaccine,
            overdue_vaccines: answerOverdueVaccines,
            missed_doses: answerOverdueVaccines,
            upcoming_vaccines: answerUpcomingVaccines,
            vaccination_history: answerVaccinationHistory,
            child_schedule: answerChildSchedule,
            nearby_centres: answerNearbyCentres,
            appointment: answerAppointments,
            vaccine_availability: answerVaccineAvailability
        });
        res.json({ success: true, answer, source: 'assistant' });
    } catch (error) {
        next(error);
    }
}