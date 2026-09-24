import pool from '../config/db.js';
import { generateChildSchedule } from '../services/schedule.service.js';
import { calculateHaversineDistance } from '../services/distance.service.js';

/**
 * Get Parent's Registered Children Profiles
 */
export async function getParentChildren(req, res, next) {
    const parentId = req.user.parentId;

    try {
        const [children] = await pool.query(
            'SELECT * FROM children WHERE parent_id = ? ORDER BY dob DESC',
            [parentId]
        );

        // Fetch counts per child (pending, completed, overdue)
        for (const child of children) {
            const [[counts]] = await pool.query(`
                SELECT 
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
                    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
                    COUNT(*) AS total_count
                FROM child_vaccination_records
                WHERE child_id = ?
            `, [child.id]);

            child.stats = {
                completed: counts.completed_count || 0,
                pending: counts.pending_count || 0,
                overdue: counts.overdue_count || 0,
                total: counts.total_count || 0
            };
        }

        res.json({ success: true, children });
    } catch (error) {
        next(error);
    }
}

/**
 * Add a New Child Profile (Triggers Auto-Schedule Generation)
 */
export async function addChild(req, res, next) {
    const parentId = req.user.parentId;
    const { name, dob, gender, bloodGroup } = req.body;

    if (!name || !dob || !gender) {
        return res.status(400).json({
            success: false,
            message: 'Child name, date of birth (DOB), and gender are required.'
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO children (parent_id, name, dob, gender, blood_group)
             VALUES (?, ?, ?, ?, ?)`,
            [parentId, name, dob, gender, bloodGroup || null]
        );
        const childId = result.insertId;

        // Auto-generate vaccination schedule records based on rules
        const recordCount = await generateChildSchedule(childId, dob);

        res.status(201).json({
            success: true,
            message: `Child profile created and ${recordCount} vaccination doses scheduled automatically!`,
            childId
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Digital Vaccination Card (Full schedule for a child)
 */
export async function getChildSchedule(req, res, next) {
    const { id } = req.params;
    const parentId = req.user.parentId;

    try {
        // Verify child belongs to parent (unless admin is viewing)
        const [children] = await pool.query('SELECT * FROM children WHERE id = ?', [id]);
        if (children.length === 0) {
            return res.status(404).json({ success: false, message: 'Child profile not found.' });
        }

        const child = children[0];
        if (req.user.role === 'parent' && child.parent_id !== parentId) {
            return res.status(403).json({ success: false, message: 'Access denied to this child profile.' });
        }

        const [records] = await pool.query(`
            SELECT 
                r.*,
                v.vaccine_name, v.dose_number, v.offset_days, v.target_disease, v.description, v.is_mandatory,
                pref_cnt.name AS preferred_centre_name, pref_cnt.address AS preferred_centre_address,
                admin_cnt.name AS administered_centre_name
            FROM child_vaccination_records r
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            LEFT JOIN centres pref_cnt ON r.preferred_centre_id = pref_cnt.id
            LEFT JOIN centres admin_cnt ON r.administered_by_centre_id = admin_cnt.id
            WHERE r.child_id = ?
            ORDER BY r.due_date ASC
        `, [id]);

        res.json({
            success: true,
            child,
            schedule: records
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Search Nearby APPROVED Healthcare Centres (Sorted by distance)
 */
export async function getNearbyCentres(req, res, next) {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            message: 'Latitude (lat) and Longitude (lng) query parameters are required.'
        });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = radius && radius !== 'all' ? parseFloat(radius) : 50; // Default 50km radius

    try {
        // Fetch all APPROVED centres
        const [centres] = await pool.query(`
            SELECT id, name, address, latitude, longitude, phone, working_hours, license_number
            FROM centres
            WHERE status = 'approved'
        `);

        // Calculate distance for each centre using Haversine formula
        let centresWithDistance = centres.map(centre => {
            const distanceKm = calculateHaversineDistance(
                userLat,
                userLng,
                parseFloat(centre.latitude),
                parseFloat(centre.longitude)
            );
            return {
                ...centre,
                distanceKm
            };
        });

        // Filter by radius if specified (e.g. <= 50km)
        if (radius !== 'all') {
            centresWithDistance = centresWithDistance.filter(c => c.distanceKm <= maxRadius);
        }

        // Sort by distance ascending
        centresWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

        res.json({
            success: true,
            userLocation: { lat: userLat, lng: userLng },
            radiusKm: radius === 'all' ? 'all' : maxRadius,
            totalCentres: centresWithDistance.length,
            centres: centresWithDistance
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Set Preferred Healthcare Centre for a Child's Specific Upcoming Dose
 */
export async function setPreferredCentre(req, res, next) {
    const { id } = req.params; // recordId
    const { centreId } = req.body;
    const parentId = req.user.parentId;

    if (!centreId) {
        return res.status(400).json({ success: false, message: 'Preferred Healthcare Centre ID is required.' });
    }

    try {
        const [records] = await pool.query(`
            SELECT r.*, c.parent_id 
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            WHERE r.id = ?
        `, [id]);

        if (records.length === 0) {
            return res.status(404).json({ success: false, message: 'Vaccination record not found.' });
        }

        if (records[0].parent_id !== parentId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const [centres] = await pool.query('SELECT id, name FROM centres WHERE id = ? AND status = "approved"', [centreId]);
        if (centres.length === 0) {
            return res.status(400).json({ success: false, message: 'Selected Healthcare Centre is invalid or not approved.' });
        }

        await pool.query(
            'UPDATE child_vaccination_records SET preferred_centre_id = ? WHERE id = ?',
            [centreId, id]
        );

        res.json({
            success: true,
            message: `Preferred healthcare centre set to '${centres[0].name}'.`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Set Preferred Healthcare Centre for ALL pending doses of a Child
 */
export async function setChildPreferredCentre(req, res, next) {
    const { childId } = req.params;
    const { centreId } = req.body;
    const parentId = req.user.parentId;

    if (!centreId) {
        return res.status(400).json({ success: false, message: 'Healthcare Centre ID is required.' });
    }

    try {
        const [children] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, parentId]);
        if (children.length === 0) {
            return res.status(403).json({ success: false, message: 'Child profile not found or access denied.' });
        }

        const [centres] = await pool.query('SELECT id, name FROM centres WHERE id = ? AND status = "approved"', [centreId]);
        if (centres.length === 0) {
            return res.status(400).json({ success: false, message: 'Selected Healthcare Centre is invalid or not approved.' });
        }

        const [result] = await pool.query(
            `UPDATE child_vaccination_records SET preferred_centre_id = ? WHERE child_id = ? AND status = 'pending'`,
            [centreId, childId]
        );

        res.json({
            success: true,
            message: `Saved '${centres[0].name}' for ${children[0].name}'s upcoming vaccination doses.`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Reschedule Vaccination Date, Time Slot & Preferred Centre for a specific record
 */
export async function rescheduleParentRecord(req, res, next) {
    const { id } = req.params; // recordId
    const { centreId, preferredDate, preferredTimeSlot } = req.body;
    const parentId = req.user.parentId;
    const userId = req.user.id;

    try {
        const [records] = await pool.query(`
            SELECT r.*, c.name AS child_name, c.parent_id, p.phone AS parent_phone, v.vaccine_name
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            WHERE r.id = ?
        `, [id]);

        if (records.length === 0) {
            return res.status(404).json({ success: false, message: 'Vaccination record not found.' });
        }

        const record = records[0];
        if (record.parent_id !== parentId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        let centreName = 'No centre selected';
        if (centreId) {
            const [centres] = await pool.query('SELECT id, name FROM centres WHERE id = ? AND status = "approved"', [centreId]);
            if (centres.length === 0) {
                return res.status(400).json({ success: false, message: 'Selected Healthcare Centre is invalid or not approved.' });
            }
            centreName = centres[0].name;
        }

        const newCentreId = centreId || null;
        const newDate = preferredDate || record.due_date;
        const newTimeSlot = preferredTimeSlot || '09:00 AM - 11:00 AM';

        await pool.query(`
            UPDATE child_vaccination_records 
            SET preferred_centre_id = ?,
                preferred_date = ?,
                preferred_time_slot = ?,
                rescheduled_by = 'parent',
                rescheduled_at = NOW()
            WHERE id = ?
        `, [newCentreId, newDate, newTimeSlot, id]);

        const notifTitle = `Vaccination Rescheduled: ${record.child_name}`;
        const notifMsg = `Appointment for ${record.child_name}'s ${record.vaccine_name} dose updated to ${newDate} (${newTimeSlot}) at ${centreName}.`;
        const smsContent = `📱 SMS to ${record.parent_phone || 'Parent Phone'}: Dear Parent, your appointment for ${record.child_name}'s ${record.vaccine_name} dose is scheduled for ${newDate} at ${newTimeSlot} at ${centreName}.`;

        // Store notification
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, phone_number, sms_status)
            VALUES (?, ?, ?, ?, 'simulated')
        `, [userId, notifTitle, notifMsg, record.parent_phone || null]);

        res.json({
            success: true,
            message: `Appointment for ${record.vaccine_name} rescheduled successfully!`,
            smsAlert: smsContent
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Clear / Delete Preferred Centre & Rescheduled Slot for a Dose
 */
export async function deleteParentPreferredCentre(req, res, next) {
    const { id } = req.params;
    const parentId = req.user.parentId;
    const userId = req.user.id;

    try {
        const [records] = await pool.query(`
            SELECT r.*, c.name AS child_name, c.parent_id, p.phone AS parent_phone, v.vaccine_name
            FROM child_vaccination_records r
            JOIN children c ON r.child_id = c.id
            JOIN parents p ON c.parent_id = p.id
            JOIN vaccine_rules v ON r.vaccine_rule_id = v.id
            WHERE r.id = ?
        `, [id]);

        if (records.length === 0 || records[0].parent_id !== parentId) {
            return res.status(404).json({ success: false, message: 'Record not found or access denied.' });
        }

        const record = records[0];

        await pool.query(`
            UPDATE child_vaccination_records 
            SET preferred_centre_id = NULL,
                preferred_date = NULL,
                preferred_time_slot = NULL,
                rescheduled_by = NULL,
                rescheduled_at = NULL
            WHERE id = ?
        `, [id]);

        const notifTitle = `Preferred Centre Removed`;
        const notifMsg = `Preferred centre choice removed for ${record.child_name}'s ${record.vaccine_name} dose.`;
        const smsContent = `📱 SMS to ${record.parent_phone || 'Parent Phone'}: Preferred healthcare centre removed for ${record.child_name}'s ${record.vaccine_name} dose.`;

        await pool.query(`
            INSERT INTO notifications (user_id, title, message, phone_number, sms_status)
            VALUES (?, ?, ?, ?, 'simulated')
        `, [userId, notifTitle, notifMsg, record.parent_phone || null]);

        res.json({
            success: true,
            message: `Preferred healthcare centre cleared for ${record.vaccine_name}.`,
            smsAlert: smsContent
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Notifications for User
 */
export async function getNotifications(req, res, next) {
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

/**
 * Mark All User Notifications as Read
 */
export async function markNotificationsRead(req, res, next) {
    const userId = req.user.id;

    try {
        await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'Notifications marked as read.' });
    } catch (error) {
        next(error);
    }
}

