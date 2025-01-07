const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const Rental = require('../models/rentalModel'); // Import du modèle Rental

// Route pour récupérer les dates indisponibles pour une moto spécifique
router.get('/unavailable-dates/:motoAnnonceId', rentalController.getUnavailableDates);

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

// Route pour supprimer une location
router.delete('/:id', async (req, res) => {
  try {
    const rentalId = req.params.id;
    
    // Supprimer la location
    const deletedRental = await Rental.findByIdAndDelete(rentalId);
    
    if (!deletedRental) {
      return res.status(404).json({ message: 'Location non trouvée.' });
    }

    res.json({ message: 'Location supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la location:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la location.' });
  }
});

module.exports = router;
