import express from 'express';
import {
    registerParent,
    registerCentre,
    login,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register-parent', registerParent);
router.post('/register-centre', registerCentre);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
