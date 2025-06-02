import Cart from '../models/cart.js';
import Product from '../models/products.js';

// @desc    Add/Update cart item
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Check if quantity is available
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Requested quantity not available'
            });
        }

        // Find existing cart or create new one
        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                products: [],
                totalPrice: 0
            });
        }

        // Check if product already exists in cart
        const existingProductIndex = cart.products.findIndex(
            item => item.product.toString() === productId
        );

        if (existingProductIndex > -1) {
            // Update quantity if product exists
            cart.products[existingProductIndex].quantity = quantity;
        } else {
            // Add new product if it doesn't exist
            cart.products.push({ product: productId, quantity });
        }

        // Calculate total price
        cart.totalPrice = cart.products.reduce((total, item) => {
            return total + (product.price * item.quantity);
        }, 0);

        cart.updatedAt = Date.now();
        await cart.save();

        // Populate product details before sending response
        await cart.populate('products.product');

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get cart items
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('products.product');

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        // Remove product from cart
        cart.products = cart.products.filter(
            item => item.product.toString() !== req.params.productId
        );

        // Recalculate total price
        const products = await Product.find({
            _id: { $in: cart.products.map(item => item.product) }
        });

        cart.totalPrice = cart.products.reduce((total, item) => {
            const product = products.find(p => p._id.toString() === item.product.toString());
            return total + (product.price * item.quantity);
        }, 0);

        cart.updatedAt = Date.now();
        await cart.save();

        await cart.populate('products.product');

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartQuantity = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid quantity'
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        // Find and update product quantity
        const productIndex = cart.products.findIndex(
            item => item.product.toString() === req.params.productId
        );

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Product not found in cart'
            });
        }

        // Check if quantity is available in stock
        const product = await Product.findById(req.params.productId);
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Requested quantity not available'
            });
        }

        cart.products[productIndex].quantity = quantity;
        cart.totalPrice = cart.products.reduce((total, item) => {
            return total + (product.price * item.quantity);
        }, 0);

        cart.updatedAt = Date.now();
        await cart.save();

        await cart.populate('products.product');

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        cart.products = [];
        cart.totalPrice = 0;
        cart.updatedAt = Date.now();
        await cart.save();

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};