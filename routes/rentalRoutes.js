const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController'); // Import du contrôleur des réservations

// Route pour récupérer les dates indisponibles pour une moto spécifique
router.get('/unavailable-dates/:motoAdId', rentalController.getUnavailableDates);

// Route pour créer une nouvelle réservation
router.post('/create', rentalController.createRental);

// Route pour capturer le paiement à la fin de la location
router.post('/capture-payment', rentalController.capturePayment);

// Route pour annuler le paiement à la fin de la location
router.post('/cancel-payment', rentalController.cancelPayment);

// Route pour récupérer toutes les réservations d'un propriétaire
router.get('/owner/:ownerId', rentalController.getRentalsByOwner);

// Route pour récupérer toutes les réservations d'un utilisateur
router.get('/user/:userId', rentalController.getRentalsByUser);


module.exports = router;
