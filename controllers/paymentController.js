const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const MotoAnnonce = require('../models/motoAnnonceModel');
const Rental = require('../models/rentalModel');
const mongoose = require('mongoose');
const { createPdfContract } = require('../utils/pdfGenerator');
const { sendEmailWithAttachment } = require('../utils/emailUtils');

// Créer une session de paiement pour la location d'une moto
exports.createRentalCheckoutSession = async (req, res) => {
  const { motoAnnonceId, startDate, endDate } = req.body;

  try {
    // Vérifie si l'ID est valide
    if (!motoAnnonceId || !mongoose.Types.ObjectId.isValid(motoAnnonceId)) {
      return res.status(400).send({ message: 'ID invalide ou manquant.' });
    }

    const motoAnnonce = await MotoAnnonce.findById(motoAnnonceId);
    if (!motoAnnonce) {
      return res.status(404).send({ message: 'Annonce de moto non trouvée.' });
    }

    // Vérifier la disponibilité des dates
    const isDateReserved = motoAnnonce.reservedDates.some((dateRange) => {
      return (
        (new Date(startDate) <= dateRange.endDate && new Date(startDate) >= dateRange.startDate) ||
        (new Date(endDate) <= dateRange.endDate && new Date(endDate) >= dateRange.startDate) ||
        (new Date(startDate) <= dateRange.startDate && new Date(endDate) >= dateRange.endDate)
      );
    });

    if (isDateReserved) {
      return res.status(400).json({ message: 'Ces dates sont déjà réservées.' });
    }

    // Calculer le montant total de la location et de la caution
    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
    const amount = motoAnnonce.pricePerDay * days;
    const depositAmount = 1000;  // Caution fixée à 1000 €

    // Créer une session de paiement Stripe pour la location + caution
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: motoAnnonce.title,
            description: `Location de ${motoAnnonce.title} pour ${days} jour(s) + caution de ${depositAmount}€`,
          },
          unit_amount: Math.round((amount + depositAmount) * 100), // Montant total en centimes
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_FRONT_BASE_URL}`,
      cancel_url: `${process.env.NEXT_PUBLIC_FRONT_BASE_URL}`,
    });

    // Ajouter les dates réservées
    motoAnnonce.reservedDates.push({ startDate: new Date(startDate), endDate: new Date(endDate) });
    await motoAnnonce.save();

    // Sauvegarder la réservation avec sessionId
    const newRental = new Rental({
      motoAnnonceId,
      userId: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      amount,
      deposit: depositAmount,
      sessionId: session.id,  // On enregistre le session ID Stripe
    });
    await newRental.save();

    // Générer le PDF en mémoire avec le prix total
    const pdfBuffer = await createPdfContract(motoAnnonce, req.user, startDate, endDate, amount);

    // Envoyer le PDF par e-mail avec une pièce jointe
    await sendEmailWithAttachment(
      req.user.email,
      'Confirmation de location de moto',
      `Votre location de la moto "${motoAnnonce.title}" a été confirmée pour la période du ${startDate} au ${endDate}.`,
      pdfBuffer
    );

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).send({ message: 'Erreur lors de la création de la session de paiement', error: error.message });
  }
};

// Rembourser la caution
exports.refundDeposit = async (req, res) => {
  const { sessionId, refundAmount } = req.body;

  try {
    // Rechercher la réservation
    const rental = await Rental.findOne({ sessionId });
    if (!rental) {
      return res.status(404).json({ message: 'Réservation non trouvée.' });
    }

    // Récupérer la session de paiement Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Vérifier que la session contient un `payment_intent`
    if (!session.payment_intent) {
      return res.status(400).json({ message: 'Pas de payment intent trouvé pour cette session.' });
    }

    // Effectuer le remboursement via Stripe
    const refund = await stripe.refunds.create({
      amount: Math.round(refundAmount * 100), // Montant en centimes
      payment_intent: session.payment_intent, // Utiliser le payment intent pour le remboursement
    });

    res.status(200).json({ message: 'Remboursement effectué avec succès.', refund });
  } catch (error) {
    console.error('Erreur lors du remboursement:', error.message);
    res.status(500).json({ message: 'Erreur lors du remboursement.', error: error.message });
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
