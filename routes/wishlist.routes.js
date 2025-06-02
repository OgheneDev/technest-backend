import express from 'express'
import { protect } from '../middleware/auth.js'
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js'

const router = express.Router();

router.use(protect);

router.route('/')
    .post(addToWishlist)
    .get(getWishlist)

router.route('/:productId')
    .delete(removeFromWishlist)

export const wishlistRouter = router;