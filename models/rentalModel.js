const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  motoAdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MotoAd', // Référence à l'annonce de moto
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Référence à l'utilisateur qui réserve
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
