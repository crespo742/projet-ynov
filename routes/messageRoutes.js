// routes/messageRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { sendMessage, getMessages, getConversations, getUnreadMessagesCount, markMessageAsRead, markMessagesAsRead } = require('../controllers/messageController');

const router = express.Router();

// Route pour envoyer un message
router.post('/send', authMiddleware, sendMessage);

// Route pour obtenir toutes les conversations de l'utilisateur connecté
router.get('/conversations', authMiddleware, getConversations);

// Route pour obtenir le nombre de messages non lus
router.get('/unread-count', authMiddleware, getUnreadMessagesCount);

// Route pour marquer plusieurs messages comme lus
router.put('/mark-as-read', authMiddleware, markMessagesAsRead);

// Route pour récupérer les messages d'une conversation
router.get('/:userId', authMiddleware, getMessages);

module.exports = router;