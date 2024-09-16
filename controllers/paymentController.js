const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const MotoAd = require('../models/motoAdModel');
const Rental = require('../models/rentalModel');
const mongoose = require('mongoose');
const { createPdfContract } = require('../utils/pdfGenerator');
const { sendEmailWithAttachment } = require('../utils/emailUtils');

// Créer une session de paiement pour la location d'une moto
exports.createRentalCheckoutSession = async (req, res) => {
  const { motoAdId, startDate, endDate } = req.body;

  try {
    // Vérifie si l'ID est valide
    if (!motoAdId || !mongoose.Types.ObjectId.isValid(motoAdId)) {
      return res.status(400).send({ message: 'ID invalide ou manquant.' });
    }

    const motoAd = await MotoAd.findById(motoAdId);
    if (!motoAd) {
      return res.status(404).send({ message: 'Annonce de moto non trouvée.' });
    }

    // Vérifier la disponibilité des dates
    const isDateReserved = motoAd.reservedDates.some((dateRange) => {
      return (
        (new Date(startDate) <= dateRange.endDate && new Date(startDate) >= dateRange.startDate) ||
        (new Date(endDate) <= dateRange.endDate && new Date(endDate) >= dateRange.startDate) ||
        (new Date(startDate) <= dateRange.startDate && new Date(endDate) >= dateRange.endDate)
      );
    });

    if (isDateReserved) {
      return res.status(400).json({ message: 'Ces dates sont déjà réservées.' });
    }

    // Calculer le montant total de la location
    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
    const amount = motoAd.pricePerDay * days;
    const depositAmount = motoAd.deposit || 100;

    // Créer une intention de paiement avec Stripe pour la caution
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: 'eur',
      payment_method_types: ['card'],
      capture_method: 'manual',
    });

    // Créer une session de paiement Stripe pour le reste de la location
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: motoAd.title,
            description: `Location de ${motoAd.title} pour ${days} jour(s)`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3002',
      cancel_url: 'http://localhost:3002',
    });

    // Ajouter les dates réservées
    motoAd.reservedDates.push({ startDate: new Date(startDate), endDate: new Date(endDate) });
    await motoAd.save();

    // Sauvegarder la réservation
    const newRental = new Rental({
      motoAdId,
      userId: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      amount,
      deposit: depositAmount,
      paymentIntentId: paymentIntent.id,
    });
    await newRental.save();

    // Générer le PDF en mémoire
    const pdfBuffer = await createPdfContract(motoAd, req.user, startDate, endDate);

    // Envoyer le PDF par e-mail avec une pièce jointe
    await sendEmailWithAttachment(
      req.user.email,
      'Confirmation de location de moto',
      `Votre location de la moto "${motoAd.title}" a été confirmée pour la période du ${startDate} au ${endDate}.`,
      pdfBuffer
    );

    res.status(200).json({ sessionId: session.id, url: session.url, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).send({ message: 'Erreur lors de la création de la session de paiement', error: error.message });
  }
};

// Rembourser la caution
exports.refundDeposit = async (req, res) => {
  const { paymentSessionId, deposit } = req.body;

  try {
    // Trouver la réservation associée
    const rental = await Rental.findOne({ paymentSessionId });

    if (!rental) {
      return res.status(404).json({ message: 'Réservation non trouvée.' });
    }

    // Rembourser le montant de la caution
    const refund = await stripe.refunds.create({
      amount: Math.round(deposit * 100), // Montant de la caution en centimes
      payment_intent: rental.paymentIntentId,
    });

    res.status(200).json({ message: 'Caution remboursée avec succès', refund });
  } catch (error) {
    console.error('Erreur lors du remboursement de la caution:', error.message);
    res.status(500).json({ message: 'Erreur lors du remboursement de la caution.', error: error.message });
  }
};





// Vérifier l'état de l'abonnement d'un utilisateur
exports.checkUserSubscription = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur non trouvé dans MongoDB.' });
    }

    const customers = await stripe.customers.list({ email: email });
    const stripeCustomer = customers.data.find(customer => customer.email === email);
    if (!stripeCustomer) {
      return res.status(404).send({ message: 'Client non trouvé dans Stripe.' });
    }

    const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomer.id });

    if (subscriptions.data.length === 0) {
      return res.send({ hasSubscription: false, message: 'Aucun abonnement trouvé pour cet utilisateur.' });
    }

    const detailedSubscriptions = subscriptions.data.map(subscription => ({
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      items: subscription.items.data.map(item => ({
        id: item.id,
        product: item.price.product,
      })),
    }));

    const activeSubscriptions = detailedSubscriptions.filter(subscription => subscription.status === 'active');
    const pendingCancellationSubscriptions = detailedSubscriptions.filter(subscription => subscription.cancel_at_period_end);

    return res.send({
      hasActiveSubscription: activeSubscriptions.length > 0,
      activeSubscriptions: activeSubscriptions,
      pendingCancellationSubscriptions: pendingCancellationSubscriptions,
    });
    
  } catch (error) {
    res.status(500).send({ message: 'Erreur lors de la vérification de l\'abonnement.', error: error.message });
  }
};

// Créer une session de paiement pour un abonnement
exports.createCheckoutSession = async (req, res) => {
  const { email, priceId } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur non trouvé.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'http://localhost:3000/chat?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).send({ message: 'Erreur lors de la création de la session de paiement', error: error.message });
  }
};

// Annuler un abonnement par email
exports.cancelSubscriptionByEmail = async (req, res) => {
  const { email } = req.body;
  
  try {
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet e-mail." });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: "Aucun abonnement actif trouvé pour cet e-mail." });
    }

    const subscriptionId = subscriptions.data[0].id;
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    res.status(200).json({
      message: 'L\'abonnement sera annulé à la fin de la période de facturation.',
      canceledSubscription
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'annulation de l'abonnement", error: error.message });
  }
};
