import Checkout from '../models/checkout.js';
import Cart from '../models/cart.js';
import paystack from 'paystack-api';

const paystackClient = paystack(process.env.PAYSTACK_SECRET_KEY);

// @desc    Initialize checkout and payment
// @route   POST /api/checkout/initialize
// @access  Private
export const initializeCheckout = async (req, res, next) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('products.product');

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Initialize Paystack transaction
        const paymentData = {
            email: req.user.email,
            amount: Math.round(cart.totalPrice * 100), // Convert to kobo
            callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
            metadata: {
                userId: req.user.id,
                cartId: cart._id
            }
        };

        const payment = await paystackClient.transaction.initialize(paymentData);

        // Create checkout record
        const checkout = await Checkout.create({
            user: req.user.id,
            cart: cart._id,
            totalPrice: cart.totalPrice,
            paymentMethod,
            shippingAddress,
            paymentReference: payment.data.reference
        });

        res.status(200).json({
            success: true,
            data: {
                checkout,
                authorizationUrl: payment.data.authorization_url
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify payment
// @route   GET /api/checkout/verify/:reference
// @access  Private
export const verifyPayment = async (req, res, next) => {
    try {
        const { reference } = req.params;

        // Verify payment with Paystack
        const payment = await paystackClient.transaction.verify(reference);

        if (payment.data.status === 'success') {
            // Update checkout status
            const checkout = await Checkout.findOneAndUpdate(
                { paymentReference: reference },
                { status: 'completed' },
                { new: true }
            );

            // Clear the cart after successful payment
            await Cart.findOneAndUpdate(
                { _id: checkout.cart },
                { products: [], totalPrice: 0 }
            );

            res.status(200).json({
                success: true,
                data: checkout
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Payment verification failed'
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get checkout history
// @route   GET /api/checkout/history
// @access  Private
export const getCheckoutHistory = async (req, res, next) => {
    try {
        const checkouts = await Checkout.find({ user: req.user.id })
            .populate('cart')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: checkouts
        });
    } catch (error) {
        next(error);
    }
};