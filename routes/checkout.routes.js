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
 * @openapi
 * /api/checkout/initialize:
 *   post:
 *     summary: Initialize a new checkout session / payment
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout session initialized
 */
router.post('/initialize', initializeCheckout);

/**
 * @openapi
 * /api/checkout/verify/{reference}:
 *   get:
 *     summary: Verify payment by reference
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification result
 */
router.get('/verify/:reference', verifyPayment);

/**
 * @openapi
 * /api/checkout/history:
 *   get:
 *     summary: Retrieve authenticated user's checkout/payment history
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of checkout history items
 */
router.get('/history', getCheckoutHistory);

export const checkoutRouter = router;