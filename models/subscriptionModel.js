const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: String,
  stripeSubscriptionId: String,
  status: {
    type: String,
    enum: ['active', 'canceled'],
    default: 'active'
  },
  // D'autres champs nécessaires...
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
