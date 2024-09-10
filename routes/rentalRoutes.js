const express = require('express');
const router = express.Router();
const Rental = require('../models/rentalModel'); // Import du modèle Rental

// Route pour récupérer les dates indisponibles pour une moto spécifique
router.get('/unavailable-dates/:motoAdId', async (req, res) => {
  const { motoAdId } = req.params;

  try {
    const rentals = await Rental.find({ motoAdId });

    // Obtenir toutes les dates réservées
    const dates = rentals.flatMap(rental => {
      const datesArray = [];
      let currentDate = new Date(rental.startDate);
      while (currentDate <= new Date(rental.endDate)) {
        datesArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1); // Ajoute un jour
      }
      return datesArray;
    });

    res.json(dates);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des dates indisponibles.', error: error.message });
  }
});

module.exports = router;
