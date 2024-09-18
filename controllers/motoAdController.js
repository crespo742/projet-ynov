const MotoAd = require('../models/motoAdModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

// Créer une nouvelle annonce
exports.createMotoAd = async (req, res) => {
    try {
        const { title, description, pricePerDay, brand, model, year, mileage, location } = req.body;

        // Collecter les URLs des images (si elles sont téléchargées)
        const imageUrls = [];
        if (req.files['image1']) imageUrls.push(req.files['image1'][0].location);
        if (req.files['image2']) imageUrls.push(req.files['image2'][0].location);
        if (req.files['image3']) imageUrls.push(req.files['image3'][0].location);

        const motoAd = new MotoAd({
            title,
            description,
            pricePerDay,
            brand,
            model,
            year,
            mileage,
            location,
            image: imageUrls,  // Stocker toutes les URLs des images
            user: req.user.id,
        });

        const savedMotoAd = await motoAd.save();

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




// Obtenir toutes les annonces, triées par date de création (les plus récentes en premier)
exports.getMotoAds = async (req, res) => {
    try {
        // Tri des annonces par 'createdAt' en ordre décroissant (-1)
        const motoAds = await MotoAd.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 }); // -1 signifie décroissant

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

// Modifier une annonce
exports.updateMotoAd = async (req, res) => {
    try {
        const { title, description, pricePerDay, brand, model, year, mileage, location } = req.body;

        const ad = await MotoAd.findById(req.params.id);

        if (!ad) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        // Vérifier si l'utilisateur connecté est le propriétaire de l'annonce
        if (ad.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette annonce' });
        }

        // Mettre à jour les champs
        ad.title = title || ad.title;
        ad.description = description || ad.description;
        ad.pricePerDay = pricePerDay || ad.pricePerDay;
        ad.brand = brand || ad.brand;
        ad.model = model || ad.model;
        ad.year = year || ad.year;
        ad.mileage = mileage || ad.mileage;
        ad.location = location || ad.location;

        const updatedAd = await ad.save();
        res.status(200).json(updatedAd);
    } catch (error) {
        res.status(500).json({ message: 'Échec de la mise à jour de l\'annonce', error });
    }
};


// Supprimer une annonce
exports.deleteMotoAd = async (req, res) => {
    try {
        const adId = req.params.id;
        const ad = await MotoAd.findById(adId);

        if (!ad) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        // Vérifier si l'utilisateur connecté est le propriétaire de l'annonce
        if (ad.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette annonce' });
        }

        // Utiliser findByIdAndDelete pour supprimer l'annonce
        await MotoAd.findByIdAndDelete(adId);
        res.status(200).json({ message: 'Annonce supprimée avec succès' });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: 'Échec de la suppression de l\'annonce', error });
    }
};


//filtres -->

// controllers/motoAdController.js
exports.getFilteredMotoAds = async (req, res) => {
    try {
        const { brand, year, minPrice, maxPrice, search, location } = req.query;

        const filters = {};

        if (brand) {
            filters.brand = brand;
        }

        if (year) {
            filters.year = year;
        }

        if (minPrice || maxPrice) {
            filters.pricePerDay = {};
            if (minPrice) {
                filters.pricePerDay.$gte = minPrice;
            }
            if (maxPrice) {
                filters.pricePerDay.$lte = maxPrice;
            }
        }

        if (search) {
            filters.title = { $regex: search, $options: 'i' };
        }

        if (location) {
            filters.location = { $regex: location, $options: 'i' }; // Recherche insensible à la casse
        }

        const motoAds = await MotoAd.find(filters);
        res.status(200).json(motoAds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch moto ads', error });
    }
};

