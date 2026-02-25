const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/', adminController.getDashboard);
router.get('/customers', adminController.getCustomers);
router.get('/customer/:id/orders', adminController.getCustomerOrders);
router.post('/order/:id/status', adminController.updateOrderStatus);

module.exports = router;
