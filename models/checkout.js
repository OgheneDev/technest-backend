import mongoose from "mongoose";

const CheckoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  // Store snapshot of cart items at checkout time
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      image: {
        type: String,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ["debit-card", "bank-transfer", "paystack"],
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending",
  },
  paymentReference: {
    type: String,
    unique: true,
    sparse: true,
  },
  paymentDetails: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
CheckoutSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Checkout = mongoose.model("Checkout", CheckoutSchema);

export default Checkout;
