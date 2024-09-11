const MotoAd = require('../models/motoAdModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

// Créer une nouvelle annonce
exports.createMotoAd = async (req, res) => {
    try {
        const { title, description, pricePerDay, brand, model, year, mileage } = req.body; // Remplacer 'price' par 'pricePerDay'
        const imageUrl = req.file ? req.file.location : null;  // L'URL de l'image sur S3

        const motoAd = new MotoAd({
            title,
            description,
            pricePerDay,  // Utiliser 'pricePerDay' au lieu de 'price'
            brand,
            model,
            year,
            mileage,
            image: imageUrl ? [imageUrl] : [],  // Stocke l'URL de l'image dans un tableau
            user: req.user.id,
        });

        const savedMotoAd = await motoAd.save();
        // Envoyer un e-mail de confirmation
        sendEmail(req.user.email, 'Confirmation de publication d\'annonce', `Votre annonce "${title}" a été publiée avec succès !`);

        const user = await User.findById(req.user.id);
        user.motoAds.push(savedMotoAd._id);
        await user.save();
        res.status(201).json(savedMotoAd);
    } catch (error) {
        console.error('Error creating ad:', error);
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
        const { pricePerDay, ...updateData } = req.body; // Extraire 'pricePerDay' et le reste des données

        const motoAd = await MotoAd.findByIdAndUpdate(req.params.id, { ...updateData, pricePerDay }, { new: true }); // Inclure 'pricePerDay' dans la mise à jour
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

//filtres -->

// controllers/motoAdController.js
exports.getFilteredMotoAds = async (req, res) => {
    try {
        const { brand, year, minPrice, maxPrice, search } = req.query;

        const filters = {};

        // Filtrer par marque
        if (brand) {
            filters.brand = brand;
        }

        // Filtrer par année
        if (year) {
            filters.year = year;
        }

        // Filtrer par prix
        if (minPrice || maxPrice) {
            filters.pricePerDay = {};  // Utiliser pricePerDay pour le filtre des prix
            if (minPrice) {
                filters.pricePerDay.$gte = parseFloat(minPrice);  // Prix minimum
            }
            if (maxPrice) {
                filters.pricePerDay.$lte = parseFloat(maxPrice);  // Prix maximum
            }
        }

        // Recherche par titre avec insensibilité à la casse
        if (search) {
            filters.title = { $regex: search, $options: 'i' };
        }

        // Trouver les annonces avec les filtres appliqués
        const motoAds = await MotoAd.find(filters);
        res.status(200).json(motoAds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch moto ads', error });
    }
};
