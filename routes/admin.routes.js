import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { getAllOrders, getTotalRevenue, getCustomersSummary } from '../controllers/admin.controller.js'

const router = express.Router();

// Protect + require admin role
router.use(protect, authorize('admin'));

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Retrieve all orders
 *     description: Retrieve a list of orders (most recent first). Supports optional filtering by order status and basic pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, canceled]
 *         description: Filter orders by status.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination (optional).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Items per page for pagination (optional).
 *     responses:
 *       200:
 *         description: A list of orders with customer and item details. Each order may include a computedTotal field when total isn't stored.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       customer:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           firstName: { type: string }
 *                           lastName: { type: string }
 *                           email: { type: string }
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             product:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 _id: { type: string }
 *                                 name: { type: string }
 *                                 price: { type: number }
 *                             price: { type: number }
 *                             quantity: { type: integer }
 *                       total:
 *                         type: number
 *                         nullable: true
 *                       computedTotal:
 *                         type: number
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized - missing or invalid authentication.
 *       403:
 *         description: Forbidden - admin role required.
 */
router.get('/orders', getAllOrders);

/**
 * @openapi
 * /api/admin/revenue:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get total revenue
 *     description: Compute total revenue across orders. Optionally filter by order status using the status query param.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, canceled]
 *         description: Only include orders with this status in revenue calculation (optional).
 *     responses:
 *       200:
 *         description: Total revenue value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       description: Sum of order.total for matched orders (0 if none).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden - admin role required.
 */
router.get('/revenue', getTotalRevenue);

/**
 * @openapi
 * /api/admin/customers:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get customers summary
 *     description: Returns aggregated customer metrics (orders count and total spent) across orders. Optionally filter by order status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, canceled]
 *         description: Only include orders with this status in the aggregation (optional).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of customers returned (optional).
 *     responses:
 *       200:
 *         description: List of customers with aggregated metrics sorted by totalSpent descending.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customerId: { type: string }
 *                       name: { type: string }
 *                       email: { type: string }
 *                       ordersCount: { type: integer }
 *                       totalSpent: { type: number }
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden - admin role required.
 */
router.get('/customers', getCustomersSummary);

export const adminRouter = router;