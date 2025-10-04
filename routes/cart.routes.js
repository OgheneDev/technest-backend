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

router.use(protect); // All cart routes are protected

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: Retrieve the authenticated user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User cart returned
 *   post:
 *     summary: Add an item to the authenticated user's cart
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
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item added to cart
 *   delete:
 *     summary: Clear the authenticated user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart quantity updated
 *   delete:
 *     summary: Remove a product from the authenticated user's cart
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
 *     responses:
 *       200:
 *         description: Product removed from cart
 */
router.route('/:productId')
    .put(updateCartQuantity)
    .delete(removeFromCart);

export const cartRouter =  router;