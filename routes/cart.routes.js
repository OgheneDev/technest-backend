import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    addToCart,
    getCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
} from '../controllers/cart.controller.js';

const router = express.Router();

router.use(protect); // All cart routes require authentication

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: Retrieve the authenticated user's cart
 *     description: Fetches the current user's shopping cart, including all products and their quantities. Returns detailed cart information with populated product data.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the user's cart
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
 *                       description: Cart ID
 *                     user:
 *                       type: string
 *                       description: User ID associated with the cart
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                           quantity:
 *                             type: number
 *                     totalPrice:
 *                       type: number
 *                       description: Total price of all items in the cart
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 user: "507f191e810c19729de860ea"
 *                 products:
 *                   - product:
 *                       _id: "507f1f77bcf86cd799439012"
 *                       name: "Sample Product"
 *                       price: 29.99
 *                     quantity: 2
 *                 totalPrice: 59.98
 *                 updatedAt: "2025-10-04T22:30:00.000Z"
 *       404:
 *         description: Cart not found for the user
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
 *                   example: Cart not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *   post:
 *     summary: Add an item to the authenticated user's cart
 *     description: Adds a new product to the user's cart or updates the quantity if the product already exists. Validates product availability and stock before adding.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add
 *                 example: "507f1f77bcf86cd799439012"
 *               quantity:
 *                 type: number
 *                 description: Number of items to add
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item successfully added to cart
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
 *                     user:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                           quantity:
 *                             type: number
 *                     totalPrice:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request (e.g., insufficient stock or invalid quantity)
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
 *                   example: Requested quantity not available
 *       404:
 *         description: Product not found
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
 *                   example: Product not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *   delete:
 *     summary: Clear the authenticated user's cart
 *     description: Removes all items from the user's cart and resets the total price to zero.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart successfully cleared
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
 *                     user:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalPrice:
 *                       type: number
 *                       example: 0
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Cart not found
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
 *                   example: Cart not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 */
router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

/**
 * @openapi
 * /api/cart/{productId}:
 *   put:
 *     summary: Update quantity for a product in the user's cart
 *     description: Updates the quantity of a specific product in the user's cart. Validates stock availability before updating.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to update
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: New quantity for the product
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart quantity successfully updated
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
 *                     user:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                           quantity:
 *                             type: number
 *                     totalPrice:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request (e.g., invalid quantity or insufficient stock)
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
 *                   example: Requested quantity not available
 *       404:
 *         description: Cart or product not found
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
 *                   example: Product not found in cart
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *   delete:
 *     summary: Remove a product from the authenticated user's cart
 *     description: Removes a specific product from the user's cart and recalculates the total price.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Product successfully removed from cart
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
 *                     user:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                           quantity:
 *                             type: number
 *                     totalPrice:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Cart or product not found
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
 *                   example: Cart not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 */
router.route('/:productId')
    .put(updateCartQuantity)
    .delete(removeFromCart);

export const cartRouter = router;