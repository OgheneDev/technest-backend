import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    initializeCheckout,
    verifyPayment,
    getCheckoutHistory
} from '../controllers/checkout.controller.js';

const router = express.Router();

router.use(protect);

router.post('/initialize', initializeCheckout);
router.get('/verify/:reference', verifyPayment);
router.get('/history', getCheckoutHistory);

export const checkoutRouter = router;