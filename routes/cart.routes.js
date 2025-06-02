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

router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

router.route('/:productId')
    .put(updateCartQuantity)
    .delete(removeFromCart);

export const cartRouter =  router;