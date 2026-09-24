import pool from '../config/db.js';

/**
 * Auto-generate full vaccination schedule for a child based on DOB & vaccine_rules
 * @param {number} childId 
 * @param {string|Date} dob YYYY-MM-DD
 */
export async function generateChildSchedule(childId, dob) {
    try {
        const [rules] = await pool.query('SELECT * FROM vaccine_rules ORDER BY offset_days ASC');
        if (rules.length === 0) {
            console.warn('⚠️ No vaccine rules found in system. Schedule not generated.');
            return [];
        }

        const dobDate = new Date(dob);

        const recordValues = rules.map(rule => {
            const dueDate = new Date(dobDate);
            dueDate.setDate(dueDate.getDate() + rule.offset_days);
            
            const formattedDueDate = dueDate.toISOString().split('T')[0];
            return [childId, rule.id, formattedDueDate, 'pending'];
        });

        const sql = `
            INSERT INTO child_vaccination_records 
            (child_id, vaccine_rule_id, due_date, status) 
            VALUES ?
        `;

        await pool.query(sql, [recordValues]);
        console.log(`✅ Generated ${recordValues.length} vaccination records for Child ID: ${childId}`);
        return recordValues.length;
    } catch (error) {
        console.error('❌ Error generating child schedule:', error);
        throw error;
    }
}
