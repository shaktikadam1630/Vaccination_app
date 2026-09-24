import pool from '../config/db.js';

/**
 * Get Vaccination Records (Assigned to this centre or Walk-in search)
 */
export async function getCentreRecords(req, res, next) {
    const centreId = req.user.centreId;
    const { status, search } = req.query;

    try {
        let sql = `
            SELECT 
                r.*,
                c.name AS child_name, c.dob AS child_dob, c.gender AS child_gender,
                v.vaccine_name, v.dose_number, v.target_disease,
                p.full_name AS parent_name, p.phone AS parent_phone
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            WHERE (r.preferred_centre_id = ? OR r.administered_by_centre_id = ? OR r.preferred_centre_id IS NULL)
        `;
        const params = [centreId, centreId];

        if (status) {
            sql += ` AND r.status = ?`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (c.name LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ` ORDER BY r.due_date ASC`;

        const [records] = await pool.query(sql, params);
        res.json({ success: true, records });
    } catch (error) {
        next(error);
    }
}

/**
 * Mark Vaccination Dose as Administered
 */
export async function administerDose(req, res, next) {
    const { id } = req.params;
    const centreId = req.user.centreId;
    const { administeredDate, batchNumber, notes } = req.body;

    if (!administeredDate || !batchNumber) {
        return res.status(400).json({
            success: false,
            message: 'Administered date and vaccine batch number are required.'
        });
    }

    try {
        // Fetch record to verify vaccine name and stock
        const [records] = await pool.query(`
            SELECT r.*, v.vaccine_name 
            FROM child_vaccination_records r
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            WHERE r.id = ?
        `, [id]);

        if (records.length === 0) {
            return res.status(404).json({ success: false, message: 'Vaccination record not found.' });
        }

        const record = records[0];

        // Deduct inventory if stock tracking is active
        const [stock] = await pool.query(
            `SELECT available_doses FROM centre_inventory WHERE centre_id = ? AND vaccine_name = ?`,
            [centreId, record.vaccine_name]
        );

        if (stock.length > 0 && stock[0].available_doses > 0) {
            await pool.query(
                `UPDATE centre_inventory SET available_doses = available_doses - 1 WHERE centre_id = ? AND vaccine_name = ?`,
                [centreId, record.vaccine_name]
            );
        }

        // Update Record
        await pool.query(`
            UPDATE child_vaccination_records 
            SET status = 'completed',
                administered_date = ?,
                batch_number = ?,
                administered_by_centre_id = ?,
                notes = ?
            WHERE id = ?
        `, [administeredDate, batchNumber, centreId, notes || null, id]);

        res.json({
            success: true,
            message: 'Vaccination dose marked as administered successfully.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Centre Inventory
 */
export async function getInventory(req, res, next) {
    const centreId = req.user.centreId;

    try {
        const [inventory] = await pool.query(
            'SELECT * FROM centre_inventory WHERE centre_id = ? ORDER BY vaccine_name ASC',
            [centreId]
        );
        res.json({ success: true, inventory });
    } catch (error) {
        next(error);
    }
}

/**
 * Upsert Centre Vaccine Stock
 */
export async function updateInventory(req, res, next) {
    const centreId = req.user.centreId;
    const { vaccineName, availableDoses } = req.body;

    if (!vaccineName || availableDoses === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Vaccine name and available doses count are required.'
        });
    }

    try {
        await pool.query(`
            INSERT INTO centre_inventory (centre_id, vaccine_name, available_doses)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE available_doses = VALUES(available_doses)
        `, [centreId, vaccineName, availableDoses]);

        res.json({
            success: true,
            message: `Stock level updated for ${vaccineName}.`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Centre Profile
 */
export async function getCentreProfile(req, res, next) {
    const centreId = req.user.centreId;

    try {
        const [centres] = await pool.query(
            `SELECT c.*, u.email FROM centres c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
            [centreId]
        );

        if (centres.length === 0) {
            return res.status(404).json({ success: false, message: 'Centre profile not found.' });
        }

        res.json({ success: true, centre: centres[0] });
    } catch (error) {
        next(error);
    }
}

/**
 * Update Centre Details (Critical location/name changes require Admin Re-approval)
 */
export async function updateCentreProfile(req, res, next) {
    const centreId = req.user.centreId;
    const { name, address, latitude, longitude, phone, workingHours, licenseNumber } = req.body;

    try {
        const [existing] = await pool.query('SELECT * FROM centres WHERE id = ?', [centreId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Centre profile not found.' });
        }

        const current = existing[0];
        let newStatus = current.status;

        // If critical location coordinates or address change, set status to pending for re-approval
        if (
            (latitude !== undefined && parseFloat(latitude) !== parseFloat(current.latitude)) ||
            (longitude !== undefined && parseFloat(longitude) !== parseFloat(current.longitude)) ||
            (address && address !== current.address)
        ) {
            newStatus = 'pending';
        }

        await pool.query(`
            UPDATE centres 
            SET name = ?, address = ?, latitude = ?, longitude = ?, phone = ?, working_hours = ?, license_number = ?, status = ?
            WHERE id = ?
        `, [
            name || current.name,
            address || current.address,
            latitude !== undefined ? latitude : current.latitude,
            longitude !== undefined ? longitude : current.longitude,
            phone || current.phone,
            workingHours || current.working_hours,
            licenseNumber || current.license_number,
            newStatus,
            centreId
        ]);

        res.json({
            success: true,
            message: newStatus === 'pending' 
                ? 'Profile updated. Critical changes submitted for Admin re-approval.' 
                : 'Profile updated successfully.',
            status: newStatus
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Reschedule Appointment for a Child (Healthcare Centre Authority)
 */
export async function rescheduleCentreRecord(req, res, next) {
    const { id } = req.params;
    const centreId = req.user.centreId;
    const userId = req.user.id;
    const { preferredDate, preferredTimeSlot, notes } = req.body;

    if (!preferredDate) {
        return res.status(400).json({ success: false, message: 'Rescheduled appointment date is required.' });
    }

    try {
        const [records] = await pool.query(`
            SELECT r.*, c.name AS child_name, p.user_id AS parent_user_id, p.full_name AS parent_name, p.phone AS parent_phone, v.vaccine_name, cnt.name AS centre_name
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            LEFT JOIN centres cnt ON cnt.id = ?
            WHERE r.id = ?
        `, [centreId, id]);

        if (records.length === 0) {
            return res.status(404).json({ success: false, message: 'Vaccination record not found.' });
        }

        const record = records[0];
        const newTimeSlot = preferredTimeSlot || '09:00 AM - 11:00 AM';
        const centreName = record.centre_name || 'Healthcare Centre';

        await pool.query(`
            UPDATE child_vaccination_records
            SET preferred_centre_id = ?,
                preferred_date = ?,
                preferred_time_slot = ?,
                notes = ?,
                rescheduled_by = 'centre',
                rescheduled_at = NOW()
            WHERE id = ?
        `, [centreId, preferredDate, newTimeSlot, notes || record.notes, id]);

        const notifTitle = `Appointment Rescheduled by Centre`;
        const notifMsg = `${centreName} has rescheduled ${record.child_name}'s ${record.vaccine_name} dose to ${preferredDate} (${newTimeSlot}).`;
        const smsContent = `📱 SMS to ${record.parent_phone}: Dear ${record.parent_name}, your child ${record.child_name}'s appointment for ${record.vaccine_name} at ${centreName} has been rescheduled to ${preferredDate} at ${newTimeSlot}.`;

        // Store notification for Parent User
        if (record.parent_user_id) {
            await pool.query(`
                INSERT INTO notifications (user_id, title, message, phone_number, sms_status)
                VALUES (?, ?, ?, ?, 'simulated')
            `, [record.parent_user_id, notifTitle, notifMsg, record.parent_phone]);
        }

        // Store notification for Centre User
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, phone_number, sms_status)
            VALUES (?, ?, ?, ?, 'simulated')
        `, [userId, `Rescheduled Appointment`, `Rescheduled ${record.child_name}'s ${record.vaccine_name} to ${preferredDate} (${newTimeSlot}).`, record.parent_phone]);

        res.json({
            success: true,
            message: `Appointment rescheduled for ${record.child_name}. Parent notified via SMS.`,
            smsAlert: smsContent
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Centre User Notifications
 */
export async function getCentreNotifications(req, res, next) {
    const userId = req.user.id;

    try {
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
            [userId]
        );
        const unreadCount = notifications.filter(n => !n.is_read).length;

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        next(error);
    }
}

