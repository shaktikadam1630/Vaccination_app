import cron from 'node-cron';
import pool from '../config/db.js';
import { sendDoseReminderEmail } from './email.service.js';
import { sendSMSNotification } from './sms.service.js';

/**
 * Auto-flag past due doses as 'overdue'
 */
export async function runOverdueCheck() {
    try {
        const [result] = await pool.query(`
            UPDATE child_vaccination_records 
            SET status = 'overdue' 
            WHERE status = 'pending' AND due_date < CURDATE()
        `);
        console.log(`⏰ [CRON OVERDUE CHECK] Marked ${result.affectedRows} overdue dose records.`);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Error updating overdue doses:', error);
    }
}

/**
 * Dispatch email and SMS reminders for doses due in 3 or 7 days
 */
export async function runReminderDispatch() {
    try {
        const [records] = await pool.query(`
            SELECT 
                r.id AS record_id,
                c.name AS child_name,
                v.vaccine_name,
                DATE_FORMAT(r.due_date, '%Y-%m-%d') AS due_date,
                p.full_name AS parent_name,
                p.phone AS parent_phone,
                u.email AS parent_email,
                cnt.name AS centre_name
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            LEFT JOIN centres cnt ON r.preferred_centre_id = cnt.id
            WHERE r.status = 'pending' 
              AND (r.due_date = CURDATE() + INTERVAL 3 DAY OR r.due_date = CURDATE() + INTERVAL 7 DAY)
              AND (r.reminder_sent_at IS NULL OR r.reminder_sent_at < CURDATE())
        `);

        console.log(`📩 [CRON REMINDER DISPATCH] Found ${records.length} upcoming doses requiring reminder.`);

        for (const rec of records) {
            // Send Email
            await sendDoseReminderEmail(
                rec.parent_email,
                rec.parent_name,
                rec.child_name,
                rec.vaccine_name,
                rec.due_date,
                rec.centre_name
            );

            // Send SMS
            const smsMsg = `Vaccination Reminder: ${rec.child_name}'s ${rec.vaccine_name} vaccine is due on ${rec.due_date}. Please visit your nearest health centre.`;
            await sendSMSNotification(rec.parent_phone, smsMsg);

            // Update reminder_sent_at
            await pool.query(
                'UPDATE child_vaccination_records SET reminder_sent_at = NOW() WHERE id = ?',
                [rec.record_id]
            );
        }
    } catch (error) {
        console.error('❌ Error dispatching reminders:', error);
    }
}

/**
 * Initialize all scheduled cron jobs
 */
export function initCronJobs() {
    // Schedule to run every day at midnight (00:00 AM)
    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Running daily vaccination system cron jobs...');
        await runOverdueCheck();
        await runReminderDispatch();
    });

    console.log('⏱️ Scheduled daily cron jobs (Overdue flagger & Notification dispatcher) active.');
}
