import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vaccination_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

/**
 * Initialize database schema if tables do not exist
 */
export async function initDB() {
    try {
        // First create database if not existing
        const rootConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            multipleStatements: true
        });

        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'vaccination_db'}\`;`);
        await rootConnection.end();

        // Now run schema script against target DB pool
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(schemaSql);

        // Safe Migrations for additional columns & tables
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    phone_number VARCHAR(20) DEFAULT NULL,
                    sms_status ENUM('sent', 'failed', 'simulated') DEFAULT 'simulated',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_notif_user (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // Add columns to child_vaccination_records if missing
            const [cols] = await pool.query(`SHOW COLUMNS FROM child_vaccination_records LIKE 'preferred_date'`);
            if (cols.length === 0) {
                await pool.query(`
                    ALTER TABLE child_vaccination_records
                    ADD COLUMN preferred_date DATE DEFAULT NULL,
                    ADD COLUMN preferred_time_slot VARCHAR(100) DEFAULT NULL,
                    ADD COLUMN rescheduled_by ENUM('parent', 'centre', 'system') DEFAULT NULL,
                    ADD COLUMN rescheduled_at DATETIME DEFAULT NULL;
                `);
                console.log('✅ Added rescheduling columns to child_vaccination_records.');
            }
        } catch (migErr) {
            console.error('Migration notice:', migErr.message);
        }

        console.log('✅ MySQL Database Schema verified and initialized successfully.');
    } catch (error) {
        console.error('❌ MySQL Initialization Error:', error.message);
    }
}

export default pool;
