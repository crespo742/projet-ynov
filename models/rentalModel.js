const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  motoAnnonceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MotoAnnonce',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  paymentIntentId: {
    type: String,
    required: false, // Modifier ici pour rendre ce champ facultatif
  },
  sessionId: {
    type: String, // Session Stripe ID
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  deposit: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
