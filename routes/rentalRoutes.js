const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route pour créer une session de paiement pour la location de moto
router.post('/rent-moto', authMiddleware, paymentController.createRentalCheckoutSession);

module.exports = router;
