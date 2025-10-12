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
 * tags:
 *   - name: Checkout
 *     description: APIs for handling user checkout and payment process
 */

/**
 * @openapi
 * /api/checkout/initialize:
 *   post:
 *     summary: Initialize a new checkout session and create a Paystack payment link
 *     description: |
 *       This endpoint initializes a Paystack transaction for the authenticated user.
 *       It retrieves the user's cart, calculates the total, and generates a payment link.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: string
 *                 example: "123 Victoria Island, Lagos, Nigeria"
 *               paymentMethod:
 *                 type: string
 *                 enum: [debit-card, bank-transfer]
 *                 example: "Paystack"
 *     responses:
 *       200:
 *         description: Checkout session successfully initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkout:
 *                       type: object
 *                       description: Created checkout record
 *                     authorizationUrl:
 *                       type: string
 *                       example: "https://checkout.paystack.com/xyz123"
 *       400:
 *         description: Cart is empty or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cart is empty"
 *       500:
 *         description: Internal server error
 */
router.post('/initialize', initializeCheckout);

/**
 * @openapi
 * /api/checkout/verify/{reference}:
 *   get:
 *     summary: Verify payment by transaction reference
 *     description: |
 *       Verifies a Paystack payment using the provided reference.  
 *       On success, marks the checkout as completed and clears the user's cart.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         description: Paystack transaction reference
 *         schema:
 *           type: string
 *           example: "T12345ABC"
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Updated checkout document
 *       400:
 *         description: Payment verification failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Payment verification failed"
 *       404:
 *         description: Checkout not found
 *       500:
 *         description: Internal server error
 */
router.get('/verify/:reference', verifyPayment);

/**
 * @openapi
 * /api/checkout/history:
 *   get:
 *     summary: Get user's checkout history
 *     description: Retrieve all checkout/payment records belonging to the authenticated user.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's checkout history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "652bcf23f91ac9321a1e6f74"
 *                       totalPrice:
 *                         type: number
 *                         example: 5000
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       paymentReference:
 *                         type: string
 *                         example: "PSK-3421ABC"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-12T12:34:56.789Z"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/history', getCheckoutHistory);

export const checkoutRouter = router;
