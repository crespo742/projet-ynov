// routes/messageRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');

const router = express.Router();

// Route pour envoyer un message
router.post('/send', authMiddleware, sendMessage);

// Route pour obtenir toutes les conversations de l'utilisateur connecté
router.get('/conversations', authMiddleware, getConversations);

// Route pour récupérer les messages d'une conversation
router.get('/:userId', authMiddleware, getMessages);

module.exports = router;