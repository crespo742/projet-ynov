// models/RatingModel.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Utilisateur qui note
  ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Utilisateur qui est noté
  rating: { type: Number, required: true }, // La note (1 à 5)
});

module.exports = mongoose.model('Rating', ratingSchema);
