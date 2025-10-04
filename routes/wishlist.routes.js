import express from 'express'
import { protect } from '../middleware/auth.js'
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js'

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/wishlist:
 *   post:
 *     summary: Add a product to the authenticated user's wishlist
 *     tags:
 *       - Wishlist
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
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *   get:
 *     summary: Retrieve the authenticated user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist returned
 */
router.route('/')
    .post(addToWishlist)
    .get(getWishlist)

/**
 * @openapi
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from the authenticated user's wishlist
 *     tags:
 *       - Wishlist
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
 *         description: Product removed from wishlist
 */
router.route('/:productId')
    .delete(removeFromWishlist)

export const wishlistRouter = router;