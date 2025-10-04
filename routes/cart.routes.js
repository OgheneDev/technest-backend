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
 * @route   GET /api/cart
 * @desc    Retrieve the authenticated user's cart
 * @access  Private
 */
router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

/**
 * @route   PUT /api/cart/:productId
 * @desc    Update quantity for a product in the user's cart
 * @access  Private
 */
router.route('/:productId')
    .put(updateCartQuantity)
    .delete(removeFromCart);

export const cartRouter =  router;