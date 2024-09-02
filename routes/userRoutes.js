const express = require('express');
const router = express.Router();
const { register, login, getUser, getAllUsers, getUserById, setModerator, deleteUserById } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const modoMiddleware = require('../middlewares/modoMiddleware');

router.post('/register', register);

router.post('/login', login);

router.get('/user', authMiddleware, getUser);

// Route pour obtenir tous les utilisateurs
router.get('/users', authMiddleware, modoMiddleware, getAllUsers);

// Route pour obtenir un utilisateur par ID
router.get('/:id', authMiddleware, modoMiddleware, getUserById);

// Route pour définir un utilisateur comme modérateur
router.put('/set-moderator/:id', authMiddleware, adminMiddleware, setModerator);

// Route pour supprimer un utilisateur (accessible uniquement aux modérateurs ou aux administrateurs)
router.delete('/:id', authMiddleware, modoMiddleware, deleteUserById);

module.exports = router;
