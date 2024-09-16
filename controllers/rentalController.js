const Rental = require('../models/rentalModel');
const MotoAd = require('../models/motoAdModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Récupérer les dates indisponibles pour une moto spécifique
exports.getUnavailableDates = async (req, res) => {
  const { motoAdId } = req.params;

  try {
    const rentals = await Rental.find({ motoAdId });

    const dates = rentals.flatMap(rental => {
      const datesArray = [];
      let currentDate = new Date(rental.startDate);
      while (currentDate <= new Date(rental.endDate)) {
        datesArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return datesArray;
    });

    res.json(dates);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des dates indisponibles.', error: error.message });
  }
};

// Créer une nouvelle réservation
exports.createRental = async (req, res) => {
    const { motoAdId, startDate, endDate, deposit, paymentMethodId } = req.body;
    const userId = req.user._id; // Suppose que l'utilisateur est authentifié et son ID est dans req.user
  
    try {
      const motoAd = await MotoAd.findById(motoAdId);
      if (!motoAd) {
        return res.status(404).send({ message: 'Annonce de moto non trouvée.' });
      }
  
      // Calculer le montant total de la location
      const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
      const totalAmount = motoAd.pricePerDay * days;
  
      // Créer une intention de paiement avec Stripe pour la caution
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(deposit * 100), // Caution en centimes
        currency: 'eur',
        payment_method: paymentMethodId, // ID de la méthode de paiement fourni par le frontend
        capture_method: 'manual', // Autorisation manuelle
        confirm: true, // Confirmer automatiquement l'intention de paiement
      });
  
      const newRental = new Rental({
        motoAdId,
        userId,
        startDate,
        endDate,
        amount: totalAmount,
        deposit,
        paymentIntentId: paymentIntent.id,
      });
  
      await newRental.save();
      res.status(201).json({ rental: newRental, clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la création de la réservation.', error: error.message });
    }
  };
  
  
  

// Capturer le paiement à la fin de la location
exports.capturePayment = async (req, res) => {
    const { paymentIntentId } = req.body;
  
    try {
      // Vérifiez que paymentIntentId est défini et valide
      if (!paymentIntentId) {
        return res.status(400).json({ message: 'L\'ID de l\'intention de paiement est manquant.' });
      }
  
      // Capture l'intention de paiement avec Stripe
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      res.status(200).json({ message: 'Paiement capturé avec succès', paymentIntent });
    } catch (error) {
      console.error('Erreur lors de la capture du paiement:', error.message);
      res.status(500).json({ message: 'Erreur lors de la capture du paiement.', error: error.message });
    }
  };
  
  
  // Annuler le paiement à la fin de la location
  exports.cancelPayment = async (req, res) => {
    const { paymentIntentId } = req.body;
  
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      res.status(200).json({ message: 'Paiement annulé avec succès', paymentIntent });
    } catch (error) {
      console.error('Erreur lors de l\'annulation du paiement:', error.message); 
      res.status(500).json({ message: 'Erreur lors de l\'annulation du paiement.', error: error.message });
    }
  };

// Récupérer toutes les réservations d'un propriétaire
exports.getRentalsByOwner = async (req, res) => {
    const { ownerId } = req.params;
  
    try {
      // Trouver toutes les annonces de moto appartenant à ce propriétaire
      const motoAds = await MotoAd.find({ user: ownerId }); // Trouve toutes les motos de ce propriétaire
  
      // Extraire les IDs des annonces de moto
      const motoAdIds = motoAds.map(ad => ad._id);
  
      // Trouver toutes les réservations associées aux annonces de moto de ce propriétaire
      const rentals = await Rental.find({ motoAdId: { $in: motoAdIds } }).populate('motoAdId'); // Utilise `populate` pour obtenir les détails de l'annonce de moto
  
      res.status(200).json(rentals);
    } catch (error) {
      console.error('Erreur lors de la récupération des locations:', error);
      res.status(500).send({ message: 'Erreur lors de la récupération des locations', error: error.message });
    }
  };
  

// Récupérer toutes les réservations faites par un utilisateur
exports.getRentalsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const rentals = await Rental.find({ userId }).populate('motoAdId'); // Utilise `populate` pour obtenir les détails de l'annonce de moto
    res.status(200).json(rentals);
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations de l\'utilisateur:', error);
    res.status(500).send({ message: 'Erreur lors de la récupération des réservations de l\'utilisateur', error: error.message });
  }
};
