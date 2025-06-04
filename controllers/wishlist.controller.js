import Wishlist from "../models/wishlist.js";
import Product from "../models/products.js";

// @desc Add to Wishlist
// @route POST /api/wishlist
// @access Private

export const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;

        // Validate if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Find existing wishlist or create one
        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user.id,
                products: []
            });
        }


        // Check if product already exists in wishlist
        const existingProductIndex = wishlist.products.findIndex(
            item => item.product.toString() === productId
        );

        if (existingProductIndex > -1) {
            // Do not add if product exists
            wishlist.products.remove({ product: productId })

        } else {
            // Add new product if it doesn't exist
            wishlist.products.push({ product: productId })
        }

        wishlist.updatedAt = Date.now();
        await wishlist.save();

        // Populate wishlist details before sending the response
        await wishlist.populate('products.product');

        res.status(200).json({
            success: true,
            data: wishlist
        });

    } catch (error) {
        next(error);
    }
}

// @desc Get Wishlist Items 
// @route GET /api/wishlist
// @access Private 

export const getWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id })
            .populate('products.product');
        
        // If no wishlist exists, create an empty one
        if (!wishlist) {
            const newWishlist = await Wishlist.create({
                user: req.user.id,
                products: []
            });

            return res.status(200).json({
                success: true,
                data: newWishlist
            });
        }

        res.status(200).json({
            success: true,
            data: wishlist
        });

    } catch (error) {
        console.error('Wishlist fetch error:', error);
        next(error);
    }
}

// @desc Remove item from wishlist
// @route DELETE /api/wishlist/:productId
// @access Private 

export const removeFromWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id }); // Add await here

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                error: 'Wishlist not found'
            });
        }

        // Remove product from wishlist
        wishlist.products = wishlist.products.filter(
            item => item.product.toString() !== req.params.productId
        );

        wishlist.updatedAt = Date.now();
        await wishlist.save();

        await wishlist.populate('products.product');

        res.status(200).json({
            success: true,
            data: wishlist
        });

    } catch (error) {
        next(error);
    }
};