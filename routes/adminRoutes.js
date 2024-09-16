const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const User = require('../models/userModel');
const MotoAd = require('../models/motoAdModel'); // Importer le modèle des annonces de moto

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
router.get('/all-moto-ads', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const motoAds = await MotoAd.find().populate('user', 'name email');
        res.status(200).json(motoAds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch moto ads', error });
    }
});

// Route pour supprimer une annonce de moto (admin uniquement)
router.delete('/moto-ads/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const motoAd = await MotoAd.findById(req.params.id);
        if (!motoAd) {
            return res.status(404).json({ message: 'Moto ad not found' });
        }

        await MotoAd.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Moto ad deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete the moto ad', error });
    }
});

// Route pour modifier une annonce de moto (admin uniquement)
router.put('/moto-ads/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { title, description, pricePerDay, brand, model, year, mileage, location } = req.body;

    try {
        const motoAd = await MotoAd.findById(req.params.id);
        if (!motoAd) {
            return res.status(404).json({ message: 'Moto ad not found' });
        }

        // Mettre à jour les champs de l'annonce
        motoAd.title = title || motoAd.title;
        motoAd.description = description || motoAd.description;
        motoAd.pricePerDay = pricePerDay || motoAd.pricePerDay;
        motoAd.brand = brand || motoAd.brand;
        motoAd.model = model || motoAd.model;
        motoAd.year = year || motoAd.year;
        motoAd.mileage = mileage || motoAd.mileage;
        motoAd.location = location || motoAd.location;

        // Sauvegarder les modifications
        await motoAd.save();

        res.status(200).json({ message: 'Moto ad updated successfully', motoAd });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: 'Failed to update the moto ad', error });
    }
});

module.exports = router;
