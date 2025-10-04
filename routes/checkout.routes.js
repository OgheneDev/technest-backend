import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    initializeCheckout,
    verifyPayment,
    getCheckoutHistory
} from '../controllers/checkout.controller.js';

const router = express.Router();

// Protect all checkout routes - user must be authenticated
router.use(protect);

/**
 * @route   POST /api/checkout/initialize
 * @desc    Initialize a new checkout session / payment
 * @access  Private
 */
router.post('/initialize', initializeCheckout);

/**
 * @route   GET /api/checkout/verify/:reference
 * @desc    Verify payment by reference
 * @access  Private
 */
router.get('/verify/:reference', verifyPayment);

/**
 * @route   GET /api/checkout/history
 * @desc    Retrieve authenticated user's checkout/payment history
 * @access  Private
 */
router.get('/history', getCheckoutHistory);

export const checkoutRouter = router;