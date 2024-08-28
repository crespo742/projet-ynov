const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/cancel-by-email', paymentController.cancelSubscriptionByEmail);
router.post('/subscription-status', paymentController.checkUserSubscription);
router.post('/create-checkout-session', paymentController.createCheckoutSession);  // Nouvel endpoint

module.exports = router;
