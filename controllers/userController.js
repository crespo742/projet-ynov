const User = require('../models/userModel');
const MotoAnnonce = require('../models/motoAnnonceModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const Rating = require('../models/RatingModel');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        // Envoyer l'e-mail de bienvenue
        const subject = 'Bienvenue sur notre plateforme !';
        const message = `Bonjour ${user.name},\n\nMerci de vous être inscrit sur notre plateforme. Nous espérons que vous apprécierez notre service.\n\nCordialement,\nL'équipe`;

        sendEmail(user.email, subject, message);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isModo: user.isModo,
                isAdmin: user.isAdmin,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isModo: user.isModo,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });  // Trie par date de création décroissante
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error });
    }
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user', error });
    }
};

// Supprimer un utilisateur par ID
exports.deleteUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'User deleted successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error });
    }
};

// Définir un utilisateur comme modérateur
exports.setModerator = async (req, res) => {
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
};

// Récupérer le profil de l'utilisateur connecté, incluant ses annonces de motos
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('motoAnnonces', 'title price brand model year');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user profile', error });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const motoAnnonces = await MotoAnnonce.find({ user: req.user.id });

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ user, motoAnnonces });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du profil utilisateur', error });
    }
};

// Ajouter une notation
exports.rateUser = async (req, res) => {
    const { rating } = req.body;
    const userId = req.params.id;
    const raterId = req.user.id; // L'utilisateur qui note

    try {
        const userToRate = await User.findById(userId);

        if (!userToRate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Vérifier si l'utilisateur a déjà noté ce profil
        if (userToRate.ratedBy.includes(raterId)) {
            return res.status(400).json({ message: 'You have already rated this user.' });
        }

        // Calculer la nouvelle note moyenne
        const newRating = ((userToRate.rating * userToRate.ratingCount) + rating) / (userToRate.ratingCount + 1);

        userToRate.rating = newRating;
        userToRate.ratingCount += 1;
        userToRate.ratedBy.push(raterId); // Ajouter l'utilisateur qui a noté

        await userToRate.save();
        res.status(200).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to submit rating', error });
    }
};


// Vérifier si un utilisateur a déjà noté un autre utilisateur
exports.checkIfUserHasRated = async (req, res) => {
    try {
        const raterId = req.user.id;
        const rateeId = req.params.id;

        const existingRating = await Rating.findOne({ rater: raterId, ratee: rateeId });
        res.status(200).json({ hasRated: !!existingRating });
    } catch (error) {
        console.error('Failed to check rating status', error);
        res.status(500).json({ message: 'Failed to check rating status' });
    }
};

// Modifier les informations de profil
exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'utilisateur passé en paramètre
        const { email, telephone } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Mettre à jour les champs
        user.email = email || user.email;
        user.telephone = telephone || user.telephone;

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error });
    }
};
