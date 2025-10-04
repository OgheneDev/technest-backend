import express from 'express'
import { protect } from '../middleware/auth.js'
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js'

const router = express.Router();

router.use(protect);

/**
 * @route   POST /api/wishlist
 * @desc    Add a product to the authenticated user's wishlist
 * @access  Private
 */
router.route('/')
    .post(addToWishlist)
    .get(getWishlist)

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove a product from the authenticated user's wishlist
 * @access  Private
 */
router.route('/:productId')
    .delete(removeFromWishlist)

export const wishlistRouter = router;