import express from 'express';
import {
    getParentChildren,
    addChild,
    getChildSchedule,
    getNearbyCentres,
    setPreferredCentre,
    setChildPreferredCentre,
    rescheduleParentRecord,
    deleteParentPreferredCentre,
    getNotifications,
    markNotificationsRead
} from '../controllers/parent.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { askParentAssistant } from '../controllers/assistant.controller.js';

const router = express.Router();

// Guard all parent routes with Auth + Parent Role Check
router.use(authenticateToken, authorizeRoles('parent'));

router.get('/children', getParentChildren);
router.post('/children', addChild);
router.get('/children/:id/schedule', getChildSchedule);
router.patch('/children/:childId/preferred-centre', setChildPreferredCentre);

router.get('/centres/nearby', getNearbyCentres);
router.patch('/records/:id/preferred-centre', setPreferredCentre);

router.patch('/records/:id/reschedule', rescheduleParentRecord);
router.delete('/records/:id/preferred-centre', deleteParentPreferredCentre);

router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markNotificationsRead);
router.post('/assistant', askParentAssistant);

export default router;
