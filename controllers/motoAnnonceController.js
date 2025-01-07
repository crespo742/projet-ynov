const MotoAnnonce = require('../models/motoAnnonceModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

// Créer une nouvelle annonce
exports.createMotoAnnonce = async (req, res) => {
    try {
        const { title, description, pricePerDay, brand, model, year, mileage, location } = req.body;

        // Collecter les URLs des images (si elles sont téléchargées)
        const imageUrls = [];
        if (req.files['image1']) imageUrls.push(req.files['image1'][0].location);
        if (req.files['image2']) imageUrls.push(req.files['image2'][0].location);
        if (req.files['image3']) imageUrls.push(req.files['image3'][0].location);

        const motoAnnonce = new MotoAnnonce({
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

        const savedMotoAnnonce = await motoAnnonce.save();

        sendEmail(req.user.email, 'Confirmation de publication d\'annonce', `Votre annonce "${title}" a été publiée avec succès !`);

        const user = await User.findById(req.user.id);
        user.motoAnnonces.push(savedMotoAnnonce._id);
        await user.save();
        res.status(201).json(savedMotoAnnonce);
    } catch (error) {
        console.error('Error creating Annonce:', error);
        res.status(500).json({ message: 'Failed to create the Annonce', error });
    }
};




// Obtenir toutes les annonces, triées par date de création (les plus récentes en premier)
exports.getMotoAnnonces = async (req, res) => {
    try {
        // Tri des annonces par 'createdAt' en ordre décroissant (-1)
        const motoAnnonces = await MotoAnnonce.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 }); // -1 signifie décroissant

        res.status(200).json(motoAnnonces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch Annonces', error });
    }
};


// Obtenir toutes les annonces d'un utilisateur spécifique
exports.getUserMotoAnnonces = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('motoAnnonces');
        res.status(200).json(user.motoAnnonces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user Annonces', error });
    }
};

// Obtenir une annonce par ID
exports.getMotoAnnonceById = async (req, res) => {
    try {
        const motoAnnonce = await MotoAnnonce.findById(req.params.id).populate('user', 'name email');
        if (!motoAnnonce) {
            return res.status(404).json({ message: 'Annonce not found' });
        }
        res.status(200).json(motoAnnonce);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch the Annonce', error });
    }
};

// Modifier une annonce
exports.updateMotoAnnonce = async (req, res) => {
    try {
        const { title, description, pricePerDay, brand, model, year, mileage, location } = req.body;

        const annonce = await MotoAnnonce.findById(req.params.id);

        if (!annonce) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        // Vérifier si l'utilisateur connecté est le propriétaire de l'annonce
        if (annonce.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette annonce' });
        }

        // Mettre à jour les champs textuels
        annonce.title = title || annonce.title;
        annonce.description = description || annonce.description;
        annonce.pricePerDay = pricePerDay || annonce.pricePerDay;
        annonce.brand = brand || annonce.brand;
        annonce.model = model || annonce.model;
        annonce.year = year || annonce.year;
        annonce.mileage = mileage || annonce.mileage;
        annonce.location = location || annonce.location;

        // Mettre à jour les images si elles sont fournies
        const imageUrls = [];
        if (req.files['image1']) imageUrls.push(req.files['image1'][0].location);
        if (req.files['image2']) imageUrls.push(req.files['image2'][0].location);
        if (req.files['image3']) imageUrls.push(req.files['image3'][0].location);

        if (imageUrls.length > 0) {
            Annonce.image = imageUrls; // Remplacer les anciennes images par les nouvelles
        }

        const updatedAnnonce = await annonce.save();
        res.status(200).json(updatedAnnonce);
    } catch (error) {
        console.error('Error updating Annonce:', error);
        res.status(500).json({ message: 'Échec de la mise à jour de l\'annonce', error });
    }
};



// Supprimer une annonce
exports.deleteMotoAnnonce = async (req, res) => {
    try {
        const annonceId = req.params.id;
        const annonce = await MotoAnnonce.findById(annonceId);

        if (!annonce) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        // Vérifier si l'utilisateur connecté est le propriétaire de l'annonce
        if (annonce.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette annonce' });
        }

        // Utiliser findByIdAndDelete pour supprimer l'annonce
        await MotoAnnonce.findByIdAndDelete(annonceId);
        res.status(200).json({ message: 'Annonce supprimée avec succès' });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: 'Échec de la suppression de l\'annonce', error });
    }
};

// Obtenir toutes les annonces d'un utilisateur spécifique par ID d'utilisateur
exports.getUserMotoAnnoncesById = async (req, res) => {
    try {
        const userAnnonces = await MotoAnnonce.find({ user: req.params.id });
        res.status(200).json(userAnnonces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch Annonces for this user', error });
    }
};

//filtres -->

// controllers/motoAnnonceController.js
exports.getFilteredMotoAnnonces = async (req, res) => {
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

        const motoAnnonces = await MotoAnnonce.find(filters);
        res.status(200).json(motoAnnonces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch moto Annonces', error });
    }
};

