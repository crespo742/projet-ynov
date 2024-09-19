const express = require('express');
const router = express.Router();
const { 
    register,
    login,
    getUser,
    getAllUsers,
    getUserById,
    setModerator,
    deleteUserById,
    getUserProfile,
    rateUser,
    checkIfUserHasRated,
    updateUserProfile
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const modoMiddleware = require('../middlewares/modoMiddleware');

router.post('/register', register);

router.post('/login', login);

router.get('/user', authMiddleware, getUser);

// Route pour obtenir le profil utilisateur et les annonces publiées
router.get('/profile', authMiddleware, getUserProfile);

// Route pour obtenir tous les utilisateurs
router.get('/users', authMiddleware, getAllUsers);

// Route pour obtenir un utilisateur par ID
router.get('/:id', authMiddleware, getUserById);

// Route pour soumettre une note
router.post('/rate/:id', authMiddleware, rateUser);

// Route pour vérifier si un utilisateur a déjà noté
router.get('/rating-status/:id', authMiddleware, checkIfUserHasRated);

// Route pour mettre à jour le profil
router.put('/profile/:id', authMiddleware, updateUserProfile);

// Route pour supprimer un utilisateur (accessible uniquement aux modérateurs ou aux administrateurs)
router.delete('/:id', authMiddleware, modoMiddleware, deleteUserById);

// Route pour définir un utilisateur comme modérateur
router.put('/set-moderator/:id', authMiddleware, adminMiddleware, setModerator);

module.exports = router;
