import pool from '../config/db.js';

/**
 * Get Admin System Summary Statistics
 */
export async function getAdminStats(req, res, next) {
    try {
        const [[pendingCentres]] = await pool.query(`SELECT COUNT(*) AS count FROM centres WHERE status = 'pending'`);
        const [[approvedCentres]] = await pool.query(`SELECT COUNT(*) AS count FROM centres WHERE status = 'approved'`);
        const [[totalParents]] = await pool.query(`SELECT COUNT(*) AS count FROM parents`);
        const [[totalChildren]] = await pool.query(`SELECT COUNT(*) AS count FROM children`);
        const [[overdueDoses]] = await pool.query(`SELECT COUNT(*) AS count FROM child_vaccination_records WHERE status = 'overdue'`);
        const [[completedDoses]] = await pool.query(`SELECT COUNT(*) AS count FROM child_vaccination_records WHERE status = 'completed'`);

        res.json({
            success: true,
            stats: {
                pendingCentres: pendingCentres.count,
                approvedCentres: approvedCentres.count,
                totalParents: totalParents.count,
                totalChildren: totalChildren.count,
                overdueDoses: overdueDoses.count,
                completedDoses: completedDoses.count
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List Healthcare Centres (Filtered by status)
 */
export async function listCentres(req, res, next) {
    const { status } = req.query;

    try {
        let sql = `
            SELECT c.*, u.email 
            FROM centres c
            JOIN users u ON c.user_id = u.id
        `;
        const params = [];

        if (status) {
            sql += ` WHERE c.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY c.created_at DESC`;

        const [centres] = await pool.query(sql, params);
        res.json({ success: true, centres });
    } catch (error) {
        next(error);
    }
}

/**
 * Update Healthcare Centre Approval Status (Approve/Reject)
 */
export async function updateCentreStatus(req, res, next) {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status. Must be 'approved', 'rejected', or 'pending'."
        });
    }

    try {
        const [result] = await pool.query(
            `UPDATE centres SET status = ?, rejection_reason = ? WHERE id = ?`,
            [status, rejectionReason || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Healthcare centre not found.' });
        }

        res.json({
            success: true,
            message: `Healthcare centre status updated to '${status}'.`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Master Vaccine Rules Table
 */
export async function getVaccineRules(req, res, next) {
    try {
        const [rules] = await pool.query('SELECT * FROM vaccine_rules ORDER BY offset_days ASC');
        res.json({ success: true, rules });
    } catch (error) {
        next(error);
    }
}

/**
 * Create Master Vaccine Rule
 */
export async function createVaccineRule(req, res, next) {
    const { vaccineName, doseNumber, offsetDays, targetDisease, description, isMandatory } = req.body;

    if (!vaccineName || doseNumber === undefined || offsetDays === undefined || !targetDisease) {
        return res.status(400).json({
            success: false,
            message: 'Vaccine name, dose number, offset days from DOB, and target disease are required.'
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO vaccine_rules (vaccine_name, dose_number, offset_days, target_disease, description, is_mandatory)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [vaccineName, doseNumber, offsetDays, targetDisease, description || null, isMandatory !== undefined ? isMandatory : true]
        );

        res.status(201).json({
            success: true,
            message: 'Vaccine rule created successfully.',
            ruleId: result.insertId
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update Vaccine Schedule Rule
 */
export async function updateVaccineRule(req, res, next) {
    const { id } = req.params;
    const { vaccineName, doseNumber, offsetDays, targetDisease, description, isMandatory } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE vaccine_rules 
             SET vaccine_name = ?, dose_number = ?, offset_days = ?, target_disease = ?, description = ?, is_mandatory = ?
             WHERE id = ?`,
            [vaccineName, doseNumber, offsetDays, targetDisease, description, isMandatory, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Vaccine rule not found.' });
        }

        res.json({ success: true, message: 'Vaccine rule updated successfully.' });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete Vaccine Schedule Rule
 */
export async function deleteVaccineRule(req, res, next) {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM vaccine_rules WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Vaccine rule not found.' });
        }
        res.json({ success: true, message: 'Vaccine rule deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

/**
 * View All Registered Children
 */
export async function getAllChildren(req, res, next) {
    try {
        const [children] = await pool.query(`
            SELECT c.*, p.full_name AS parent_name, p.phone AS parent_phone, u.email AS parent_email
            FROM children c
            JOIN parents p ON c.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            ORDER BY c.created_at DESC
        `);

        res.json({ success: true, children });
    } catch (error) {
        next(error);
    }
}

/**
 * View All Vaccination Records Across System
 */
export async function getAllRecords(req, res, next) {
    try {
        const [records] = await pool.query(`
            SELECT 
                r.*,
                c.name AS child_name, c.dob AS child_dob,
                v.vaccine_name, v.dose_number, v.target_disease,
                pref_cnt.name AS preferred_centre_name,
                admin_cnt.name AS administered_centre_name,
                p.full_name AS parent_name, p.phone AS parent_phone
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            LEFT JOIN centres pref_cnt ON r.preferred_centre_id = pref_cnt.id
            LEFT JOIN centres admin_cnt ON r.administered_by_centre_id = admin_cnt.id
            ORDER BY r.due_date ASC
        `);

        res.json({ success: true, records });
    } catch (error) {
        next(error);
    }
}
