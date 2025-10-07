import Order from '../models/order.js';

// @desc Get Orders
// @route /api/admin/orders
// @access Private(admin)

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name price')
      .lean();

    // compute total per order if not present
    const result = orders.map(o => {
      const computedTotal = o.total ?? (o.items?.reduce((sum, it) => sum + (it.price ?? it.product?.price ?? 0) * (it.quantity ?? 1), 0));
      return { ...o, computedTotal };
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// @desc Get Revenue
// @route /api/admin/revenue
// @access Private(admin)

export const getTotalRevenue = async (req, res, next) => {
  try {
    const match = {};
    if (req.query.status) match.status = req.query.status;

    const agg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' } // assumes order.total exists
        }
      }
    ]);

    const totalRevenue = agg[0]?.totalRevenue ?? 0;
    res.status(200).json({ success: true, data: { totalRevenue } });
  } catch (err) {
    next(err);
  }
};

// @desc Get Customers
// @route /api/admin/customers
// @access Private(admin)

export const getCustomersSummary = async (req, res, next) => {
  try {
    const agg = await Order.aggregate([
      // optionally filter by status via query
      ...(req.query.status ? [{ $match: { status: req.query.status } }] : []),
      {
        $group: {
          _id: '$customer',
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: '$total' } // uses stored order.total
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          ordersCount: 1,
          totalSpent: 1
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    res.status(200).json({ success: true, data: agg });
  } catch (err) {
    next(err);
  }
};