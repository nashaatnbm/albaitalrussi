const Order = require('../models/Order');
const User = require('../models/User');

// GET /admin
exports.getDashboard = async (req, res) => {
  try {
    const statusFilter = req.query.status || '';

    const query = statusFilter ? { status: statusFilter } : {};

    const [orders, totalOrders, pendingOrders, totalCustomers] = await Promise.all([
      Order.find(query).populate('user', 'name email phone').sort({ createdAt: -1 }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'customer' })
    ]);

    // Revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.render('admin/dashboard', {
      title: 'لوحة التحكم',
      orders,
      stats: { totalOrders, pendingOrders, totalCustomers, totalRevenue },
      statusFilter
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'خطأ في تحميل البيانات', user: req.session });
  }
};

// GET /admin/customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });

    // Get order count per customer
    const customersWithOrders = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ user: c._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: c._id, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        return {
          ...c.toObject(),
          orderCount,
          totalSpent: totalSpent[0]?.total || 0
        };
      })
    );

    res.render('admin/customers', {
      title: 'العملاء',
      customers: customersWithOrders
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'خطأ في تحميل البيانات', user: req.session });
  }
};

// GET /admin/customer/:id/orders
exports.getCustomerOrders = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.redirect('/admin/customers');

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });

    res.render('admin/customer-orders', {
      title: `طلبات ${customer.name}`,
      customer,
      orders
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/customers');
  }
};

// POST /admin/order/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
