import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import { initCronJobs } from './services/cron.service.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import centreRoutes from './routes/centre.routes.js';
import parentRoutes from './routes/parent.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/centre', centreRoutes);
app.use('/api/parent', parentRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        system: 'Digital Vaccination Management System API',
        timestamp: new Date().toISOString()
    });
});

// Central Error Handler
app.use(errorHandler);

// Start Server and Initialize Database & Scheduled Cron Jobs
async function startServer() {
    try {
        await initDB();
        initCronJobs();

        app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(`🚀 Vaccination Server running on http://localhost:${PORT}`);
            console.log(`====================================================`);
        });
    } catch (error) {
        console.error('❌ Failed to start vaccination server:', error);
    }
}

startServer();
