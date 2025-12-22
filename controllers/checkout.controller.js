import Checkout from "../models/checkout.js";
import Cart from "../models/cart.js";
import paystack from "paystack-api";
import crypto from "crypto";

const paystackClient = paystack(process.env.PAYSTACK_SECRET_KEY);

// @desc    Initialize checkout and payment
// @route   POST /api/checkout/initialize
// @access  Private
export const initializeCheckout = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: "Shipping address and payment method are required",
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "products.product"
    );

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty",
      });
    }

    // Initialize Paystack transaction
    const paymentData = {
      email: req.user.email,
      amount: Math.round(cart.totalPrice * 100), // Convert to kobo
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
      metadata: {
        userId: req.user.id,
        cartId: cart._id.toString(),
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: req.user.name || req.user.email.split("@")[0],
          },
        ],
      },
    };

    const payment = await paystackClient.transaction.initialize(paymentData);

    // Create checkout record
    const checkout = await Checkout.create({
      user: req.user.id,
      cart: cart._id,
      totalPrice: cart.totalPrice,
      paymentMethod,
      shippingAddress,
      paymentReference: payment.data.reference,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      data: {
        checkout,
        authorizationUrl: payment.data.authorization_url,
        reference: payment.data.reference,
        accessCode: payment.data.access_code,
      },
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

    if (payment.data.status === "success") {
      // Update checkout status and payment details
      const checkout = await Checkout.findOneAndUpdate(
        { paymentReference: reference },
        {
          status: "completed",
          paymentDetails: {
            gateway: "paystack",
            transactionId: payment.data.id,
            paidAt: payment.data.paid_at,
            channel: payment.data.channel,
            currency: payment.data.currency,
            ipAddress: payment.data.ip_address,
          },
        },
        { new: true }
      ).populate("cart");

      if (!checkout) {
        return res.status(404).json({
          success: false,
          error: "Checkout not found",
        });
      }

      // Clear the cart after successful payment
      await Cart.findOneAndUpdate(
        { _id: checkout.cart._id },
        { products: [], totalPrice: 0 }
      );

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: checkout,
      });
    } else {
      // Update checkout status to failed
      await Checkout.findOneAndUpdate(
        { paymentReference: reference },
        { status: "failed" }
      );

      res.status(400).json({
        success: false,
        error: "Payment verification failed",
        paymentStatus: payment.data.status,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Webhook for Paystack payment verification
// @route   POST /api/checkout/webhook
// @access  Public (Called by Paystack)
export const webhookHandler = async (req, res, next) => {
  try {
    // Verify Paystack signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid signature" });
    }

    const event = req.body;

    // Verify the event is from Paystack
    if (event.event === "charge.success") {
      const { reference } = event.data;

      const checkout = await Checkout.findOneAndUpdate(
        { paymentReference: reference },
        {
          status: "completed",
          paymentDetails: {
            gateway: "paystack",
            transactionId: event.data.id,
            paidAt: event.data.paid_at,
            channel: event.data.channel,
            currency: event.data.currency,
          },
        },
        { new: true }
      ).populate("cart");

      if (checkout) {
        // Clear the cart
        await Cart.findOneAndUpdate(
          { _id: checkout.cart._id },
          { products: [], totalPrice: 0 }
        );
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get checkout by ID
// @route   GET /api/checkout/:id
// @access  Private
export const getCheckoutById = async (req, res, next) => {
  try {
    const checkout = await Checkout.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate("cart")
      .populate("user", "name email");

    if (!checkout) {
      return res.status(404).json({
        success: false,
        error: "Checkout not found",
      });
    }

    res.status(200).json({
      success: true,
      data: checkout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get checkout history
// @route   GET /api/checkout/history
// @access  Private
export const getCheckoutHistory = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const checkouts = await Checkout.find(filter)
      .populate("cart")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Checkout.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: checkouts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: checkouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel checkout/order
// @route   PUT /api/checkout/:id/cancel
// @access  Private
export const cancelCheckout = async (req, res, next) => {
  try {
    const checkout = await Checkout.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        error: "Checkout not found",
      });
    }

    // Only allow cancellation if payment is pending
    if (checkout.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel checkout with status: ${checkout.status}`,
      });
    }

    checkout.status = "cancelled";
    await checkout.save();

    res.status(200).json({
      success: true,
      message: "Checkout cancelled successfully",
      data: checkout,
    });
  } catch (error) {
    next(error);
  }
};
