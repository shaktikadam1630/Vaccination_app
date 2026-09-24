import express from 'express';
import {
    getAdminStats,
    listCentres,
    updateCentreStatus,
    getVaccineRules,
    createVaccineRule,
    updateVaccineRule,
    deleteVaccineRule,
    getAllChildren,
    getAllRecords
} from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply Auth + Admin Role Check to all routes
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/centres', listCentres);
router.patch('/centres/:id/status', updateCentreStatus);

router.get('/vaccine-rules', getVaccineRules);
router.post('/vaccine-rules', createVaccineRule);
router.put('/vaccine-rules/:id', updateVaccineRule);
router.delete('/vaccine-rules/:id', deleteVaccineRule);

router.get('/children', getAllChildren);
router.get('/records', getAllRecords);

export default router;
