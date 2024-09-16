const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/cancel-by-email', paymentController.cancelSubscriptionByEmail);
router.post('/subscription-status', paymentController.checkUserSubscription);
router.post('/create-checkout-session', paymentController.createCheckoutSession);  // Nouvel endpoint
router.post('/create-rental-checkout-session', authMiddleware, paymentController.createRentalCheckoutSession);
router.post('/refund-deposit', paymentController.refundDeposit);

module.exports = router;
