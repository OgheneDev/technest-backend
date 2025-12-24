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

    // Get user's cart with populated products
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "products.product"
    );

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty",
      });
    }

    // Create snapshot of cart items at checkout time
    const items = cart.products.map((item) => {
      // Handle case where product might not be populated or deleted
      if (!item.product) {
        throw new Error("One or more products in cart are no longer available");
      }

      return {
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || "",
      };
    });

    // Initialize Paystack transaction
    const paymentData = {
      email: req.user.email,
      amount: Math.round(cart.totalPrice * 100),
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

    // Create checkout record with items snapshot
    const checkout = await Checkout.create({
      user: req.user.id,
      cart: cart._id,
      items: items, // Store the snapshot of cart items
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
    // Get reference from params (URL path)
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: "Payment reference is required",
      });
    }

    console.log("Verifying payment with reference:", reference);

    // FIX: Pass the reference as an object, not a string
    const payment = await paystackClient.transaction.verify({ reference });

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
    console.error("Payment verification error:", error);

    // Provide more specific error message
    let errorMessage = "Payment verification failed";
    if (error.message.includes("reference")) {
      errorMessage = "Invalid payment reference";
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
      .populate("items.product", "name price images description") // Populate the items
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
