const MotoAd = require('../models/motoAdModel');
const User = require('../models/userModel');

// Créer une nouvelle annonce
exports.createMotoAd = async (req, res) => {
    try {
        const motoAd = new MotoAd({
            ...req.body,
            user: req.user.id,
        });
        const savedMotoAd = await motoAd.save();

        // Ajouter l'annonce à la liste des annonces de l'utilisateur
        const user = await User.findById(req.user.id);
        user.motoAds.push(savedMotoAd._id);
        await user.save();

        res.status(201).json(savedMotoAd);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create the ad', error });
    }
};

// Obtenir toutes les annonces
exports.getMotoAds = async (req, res) => {
    try {
        const motoAds = await MotoAd.find().populate('user', 'name email');
        res.status(200).json(motoAds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ads', error });
    }
};

// Obtenir toutes les annonces d'un utilisateur spécifique
exports.getUserMotoAds = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('motoAds');
        res.status(200).json(user.motoAds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user ads', error });
    }
};

// Obtenir une annonce par ID
exports.getMotoAdById = async (req, res) => {
    try {
        const motoAd = await MotoAd.findById(req.params.id).populate('user', 'name email');
        if (!motoAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json(motoAd);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch the ad', error });
    }
};

// Mettre à jour une annonce
exports.updateMotoAd = async (req, res) => {
    try {
        const motoAd = await MotoAd.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!motoAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json(motoAd);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update the ad', error });
    }
};

// Supprimer une annonce
exports.deleteMotoAd = async (req, res) => {
    try {
        const motoAd = await MotoAd.findByIdAndDelete(req.params.id);
        if (!motoAd) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete the ad', error });
    }
};