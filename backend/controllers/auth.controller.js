import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendPasswordResetOTP } from '../services/email.service.js';

/**
 * Register Parent Account
 */
export async function registerParent(req, res, next) {
    const { email, password, fullName, phone, address } = req.body;

    if (!email || !password || !fullName || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, full name, and phone number are required.'
        });
    }

    try {
        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create User
        const [userResult] = await pool.query(
            `INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'parent')`,
            [email, passwordHash]
        );
        const userId = userResult.insertId;

        // Create Parent Profile
        const [parentResult] = await pool.query(
            `INSERT INTO parents (user_id, full_name, phone, address) VALUES (?, ?, ?, ?)`,
            [userId, fullName, phone, address || null]
        );

        // Generate JWT Token
        const token = jwt.sign(
            { userId, email, role: 'parent' },
            process.env.JWT_SECRET || 'vaccination_system_super_secret_jwt_key_2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Parent registered successfully.',
            token,
            user: {
                id: userId,
                parentId: parentResult.insertId,
                email,
                role: 'parent',
                fullName,
                phone
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Healthcare Centre Registration Request (Starts as 'pending')
 */
export async function registerCentre(req, res, next) {
    const { email, password, name, address, latitude, longitude, phone, workingHours, licenseNumber } = req.body;

    if (!email || !password || !name || !address || latitude === undefined || longitude === undefined || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, centre name, address, latitude, longitude, and phone are required.'
        });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create User
        const [userResult] = await pool.query(
            `INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'centre')`,
            [email, passwordHash]
        );
        const userId = userResult.insertId;

        // Create Centre Profile with status 'pending'
        await pool.query(
            `INSERT INTO centres (user_id, name, address, latitude, longitude, phone, working_hours, license_number, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, name, address, latitude, longitude, phone, workingHours || '09:00 AM - 05:00 PM', licenseNumber || null]
        );

        res.status(201).json({
            success: true,
            message: 'Healthcare Centre registration submitted successfully. Account pending Admin approval.',
            status: 'pending'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Unified Login for Admin, Centre, and Parent
 */
export async function login(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required.'
        });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        let profileData = {};

        // Role-Specific Profile Verification
        if (user.role === 'centre') {
            const [centres] = await pool.query('SELECT * FROM centres WHERE user_id = ?', [user.id]);
            if (centres.length > 0) {
                const centre = centres[0];
                if (centre.status !== 'approved') {
                    return res.status(403).json({
                        success: false,
                        message: `Your centre registration status is currently '${centre.status}'. Access requires Admin approval.`,
                        status: centre.status,
                        rejectionReason: centre.rejection_reason
                    });
                }
                profileData = { centreId: centre.id, name: centre.name, status: centre.status };
            }
        } else if (user.role === 'parent') {
            const [parents] = await pool.query('SELECT * FROM parents WHERE user_id = ?', [user.id]);
            if (parents.length > 0) {
                profileData = { parentId: parents[0].id, fullName: parents[0].full_name, phone: parents[0].phone };
            }
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'vaccination_system_super_secret_jwt_key_2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Logged in successfully.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                ...profileData
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Request Forgot Password OTP (Admin/All Roles)
 */
export async function forgotPassword(req, res, next) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    try {
        const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No account found with this email address.' });
        }

        const userId = users[0].id;
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        await pool.query(
            'UPDATE users SET reset_otp = ?, reset_otp_expires_at = ? WHERE id = ?',
            [otp, expiresAt, userId]
        );

        await sendPasswordResetOTP(email, otp);

        res.json({
            success: true,
            message: 'Password reset OTP sent to your registered email address.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Reset Password using OTP
 */
export async function resetPassword(req, res, next) {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Email, OTP, and new password are required.'
        });
    }

    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expires_at > NOW()',
            [email, otp]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP verification code.'
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires_at = NULL WHERE id = ?',
            [passwordHash, users[0].id]
        );

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        next(error);
    }
}
