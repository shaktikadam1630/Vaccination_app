import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

/**
 * Authenticate JWT token from Authorization header
 */
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Authentication token missing.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vaccination_system_super_secret_jwt_key_2026');
        
        // Fetch user from DB to ensure account is active and role matches
        const [users] = await pool.query(
            'SELECT id, email, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User account no longer exists.'
            });
        }

        req.user = users[0]; // { id, email, role }

        // If user is a centre, attach centre status and details
        if (req.user.role === 'centre') {
            const [centres] = await pool.query('SELECT id, status, name FROM centres WHERE user_id = ?', [req.user.id]);
            if (centres.length > 0) {
                req.user.centreId = centres[0].id;
                req.user.centreStatus = centres[0].status;
                req.user.centreName = centres[0].name;
            }
        } else if (req.user.role === 'parent') {
            const [parents] = await pool.query('SELECT id, full_name, phone FROM parents WHERE user_id = ?', [req.user.id]);
            if (parents.length > 0) {
                req.user.parentId = parents[0].id;
                req.user.fullName = parents[0].full_name;
                req.user.phone = parents[0].phone;
            }
        }

        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.',
            error: error.message
        });
    }
}

/**
 * Role-Based Access Control (RBAC) Authorization Middleware
 * @param  {...string} allowedRoles Roles permitted to access the route ('admin', 'centre', 'parent')
 */
export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
            });
        }

        // Additional Check for Healthcare Centre Role: Must be Approved!
        if (req.user.role === 'centre') {
            if (req.user.centreStatus !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: `Healthcare centre account is currently '${req.user.centreStatus || 'pending'}'. Access requires Admin approval.`,
                    centreStatus: req.user.centreStatus
                });
            }
        }

        next();
    };
}
