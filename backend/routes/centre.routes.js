import express from 'express';
import {
    getCentreRecords,
    administerDose,
    getInventory,
    updateInventory,
    getCentreProfile,
    updateCentreProfile,
    rescheduleCentreRecord,
    getCentreNotifications
} from '../controllers/centre.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Guard all centre routes with Auth + Centre Role Check
router.use(authenticateToken, authorizeRoles('centre'));

router.get('/records', getCentreRecords);
router.patch('/records/:id/administer', administerDose);
router.patch('/records/:id/reschedule', rescheduleCentreRecord);

router.get('/inventory', getInventory);
router.put('/inventory', updateInventory);

router.get('/profile', getCentreProfile);
router.put('/profile', updateCentreProfile);

router.get('/notifications', getCentreNotifications);

export default router;
