import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: { // snapshot of product name at purchase time
        type: String,
        required: true
      },
      price: { // snapshot of product price at purchase time
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  total: { // matches controller aggregation
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String
  },
  paymentResult: {
    type: mongoose.Schema.Types.Mixed
  },
  shippingAddress: {
    address: String,
    city: String,
    postalCode: String,
    country: String
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;