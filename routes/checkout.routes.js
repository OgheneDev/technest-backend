import express from "express";
import { protect } from "../middleware/auth.js";
import {
  initializeCheckout,
  verifyPayment,
  getCheckoutHistory,
  getCheckoutById,
  cancelCheckout,
  webhookHandler,
} from "../controllers/checkout.controller.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Checkout
 *     description: APIs for handling user checkout and payment process
 */

// Protect all checkout routes except webhook
router.use(protect);

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
 *       201:
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
 *                     reference:
 *                       type: string
 *                       example: "T12345ABC"
 *                     accessCode:
 *                       type: string
 *                       example: "ACC_123xyz"
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
router.post("/initialize", initializeCheckout);

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
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully"
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
 *                 paymentStatus:
 *                   type: string
 *                   example: "failed"
 *       404:
 *         description: Checkout not found
 *       500:
 *         description: Internal server error
 */
router.get("/verify/:reference", verifyPayment);

/**
 * @openapi
 * /api/checkout/webhook:
 *   post:
 *     summary: Paystack webhook for payment notifications
 *     description: |
 *       Endpoint for Paystack to send payment notifications.
 *       Updates checkout status and clears cart on successful payment.
 *       This endpoint does not require authentication.
 *     tags:
 *       - Checkout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "charge.success"
 *               data:
 *                 type: object
 *                 properties:
 *                   reference:
 *                     type: string
 *                     example: "T12345ABC"
 *                   status:
 *                     type: string
 *                     example: "success"
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 */
router.post("/webhook", webhookHandler); // Note: No protect middleware for webhook

/**
 * @openapi
 * /api/checkout/{id}:
 *   get:
 *     summary: Get a specific checkout by ID
 *     description: Retrieve details of a specific checkout belonging to the authenticated user.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Checkout ID
 *         schema:
 *           type: string
 *           example: "652bcf23f91ac9321a1e6f74"
 *     responses:
 *       200:
 *         description: Checkout details retrieved successfully
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
 *                     _id:
 *                       type: string
 *                       example: "652bcf23f91ac9321a1e6f74"
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john@example.com"
 *                     totalPrice:
 *                       type: number
 *                       example: 5000
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     paymentReference:
 *                       type: string
 *                       example: "PSK-3421ABC"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T12:34:56.789Z"
 *       404:
 *         description: Checkout not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getCheckoutById);

/**
 * @openapi
 * /api/checkout/history:
 *   get:
 *     summary: Get user's checkout history with filtering and pagination
 *     description: Retrieve all checkout/payment records belonging to the authenticated user.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter by checkout status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *           example: "completed"
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of items per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
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
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 *                 currentPage:
 *                   type: integer
 *                   example: 1
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
 *                       paymentMethod:
 *                         type: string
 *                         example: "paystack"
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
router.get("/history", getCheckoutHistory);

/**
 * @openapi
 * /api/checkout/{id}/cancel:
 *   put:
 *     summary: Cancel a pending checkout/order
 *     description: Cancel a checkout that is still in pending status.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Checkout ID
 *         schema:
 *           type: string
 *           example: "652bcf23f91ac9321a1e6f74"
 *     responses:
 *       200:
 *         description: Checkout cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Checkout cancelled successfully"
 *                 data:
 *                   type: object
 *                   description: Updated checkout document
 *       400:
 *         description: Cannot cancel checkout with current status
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
 *                   example: "Cannot cancel checkout with status: completed"
 *       404:
 *         description: Checkout not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/cancel", cancelCheckout);

export const checkoutRouter = router;
