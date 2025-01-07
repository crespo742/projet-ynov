const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const User = require('../models/userModel');
const MotoAnnonce = require('../models/motoAnnonceModel'); // Importer le modèle des annonces de moto

const router = express.Router();

// Route pour définir un utilisateur comme modérateur
router.put('/set-moderator/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isModo = true;
        await user.save();

        res.status(200).json({ message: 'User is now a moderator', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to set moderator', error });
    }
});

// Route pour obtenir toutes les annonces (accessible uniquement aux admins)
router.get('/all-moto-Annonces', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const motoAnnonces = await MotoAnnonce.find().populate('user', 'name email');
        res.status(200).json(motoAnnonces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch moto Annonces', error });
    }
});

// Route pour supprimer une annonce de moto (admin uniquement)
router.delete('/moto-Annonces/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const motoAnnonce = await MotoAnnonce.findById(req.params.id);
        if (!motoAnnonce) {
            return res.status(404).json({ message: 'Moto Annonce not found' });
        }

        await MotoAnnonce.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Moto Annonce deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete the moto Annonce', error });
    }
});

// Route pour modifier une annonce de moto (admin uniquement)
router.put('/moto-Annonces/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { title, description, pricePerDay, brand, model, year, mileage, location } = req.body;

    try {
        const motoAnnonce = await MotoAnnonce.findById(req.params.id);
        if (!motoAnnonce) {
            return res.status(404).json({ message: 'Moto Annonce not found' });
        }

        // Mettre à jour les champs de l'annonce
        motoAnnonce.title = title || motoAnnonce.title;
        motoAnnonce.description = description || motoAnnonce.description;
        motoAnnonce.pricePerDay = pricePerDay || motoAnnonce.pricePerDay;
        motoAnnonce.brand = brand || motoAnnonce.brand;
        motoAnnonce.model = model || motoAnnonce.model;
        motoAnnonce.year = year || motoAnnonce.year;
        motoAnnonce.mileage = mileage || motoAnnonce.mileage;
        motoAnnonce.location = location || motoAnnonce.location;

        // Sauvegarder les modifications
        await motoAnnonce.save();

        res.status(200).json({ message: 'Moto Annonce updated successfully', motoAnnonce });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: 'Failed to update the moto Annonce', error });
    }
});

module.exports = router;
