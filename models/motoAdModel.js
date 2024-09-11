const mongoose = require('mongoose');

const MotoAdSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  pricePerDay: {
    type: Number,
    required: true, // Ce champ est requis pour calculer le coût de location
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  mileage: {
    type: Number,
    required: true,
  },
  image: {
    type: [String], 
    required: false, 
  },
  location: {
    type: String, // Ce champ va contenir la ville sélectionnée par l'utilisateur
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reservedDates: [
    {
      startDate: Date,
      endDate: Date,
    },
  ],
});

module.exports = mongoose.model('MotoAd', MotoAdSchema);
