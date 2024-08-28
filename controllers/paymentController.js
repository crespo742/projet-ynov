const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');

// Fonction pour vérifier l'état de l'abonnement d'un utilisateur
exports.checkUserSubscription = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifier d'abord dans la base de données MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur non trouvé dans MongoDB.' });
    }

    // Lister tous les clients sur Stripe avec l'email spécifié
    const customers = await stripe.customers.list({ email: email });

    // Trouver le client Stripe correspondant à l'email
    const stripeCustomer = customers.data.find(customer => customer.email === email);
    if (!stripeCustomer) {
      return res.status(404).send({ message: 'Client non trouvé dans Stripe.' });
    }

    // Vérifier si le client a des abonnements
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
    });

    if (subscriptions.data.length === 0) {
      return res.send({
        hasSubscription: false,
        message: 'Aucun abonnement trouvé pour cet utilisateur.'
      });
    }

    // Examiner l'état de l'abonnement et vérifier s'il est actif ou prévu pour annulation
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

exports.createCheckoutSession = async (req, res) => {
  const { email, priceId } = req.body; // Récupérer également priceId de la requête

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'Utilisateur non trouvé.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: priceId, // Utilisez le priceId fourni dans la requête
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'http://localhost:3000/chat?session_id={CHECKOUT_SESSION_ID}', // Utilisez une variable de session pour le succès
      cancel_url: 'http://localhost:3000/cancel',
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).send({ message: 'Erreur lors de la création de la session de paiement', error: error.message });
  }
};



exports.cancelSubscriptionByEmail = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Récupérer le customer ID basé sur l'email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet e-mail." });
    }

    const customerId = customers.data[0].id;

    // Récupérer tous les abonnements actifs pour ce customer ID
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: "Aucun abonnement actif trouvé pour cet e-mail." });
    }

    const subscriptionId = subscriptions.data[0].id;

    // Annuler l'abonnement
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    res.status(200).json({
      message: 'L\'abonnement sera annulé à la fin de la période de facturation.',
      canceledSubscription
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'annulation de l'abonnement",
      error: error.message
    });
  }
};
