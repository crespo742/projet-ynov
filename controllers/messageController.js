const Message = require('../models/messageModel');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/userModel');

// Envoyer un message
exports.sendMessage = async (req, res) => {
    const { recipient, content } = req.body;

    try {
        const message = new Message({
            sender: req.user.id,
            recipient,
            content,
        });

        await message.save();

        // Envoyer un e-mail à l'utilisateur destinataire
        const recipientUser = await User.findById(recipient);
        sendEmail(recipientUser.email, 'Nouveau message reçu', `Vous avez reçu un nouveau message de ${req.user.name}: "${content}"`);

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message', error });
    }
};

// Obtenir toutes les conversations d'un utilisateur
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Trouver les conversations uniques
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { recipient: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $lt: ["$sender", "$recipient"] },
                            then: ["$sender", "$recipient"],
                            else: ["$recipient", "$sender"]
                        }
                    },
                    latestMessage: { $last: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    participants: "$_id",
                    latestMessage: 1
                }
            }
        ]);

        // Récupérer les détails des participants avec populate
        const populatedConversations = await Promise.all(conversations.map(async (conversation) => {
            const [participant1Id, participant2Id] = conversation.participants;

            const participant1 = await User.findById(participant1Id).select('name email');
            const participant2 = await User.findById(participant2Id).select('name email');

            return {
                participants: [participant1, participant2],
                latestMessage: conversation.latestMessage,
            };
        }));

        res.status(200).json(populatedConversations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch conversations', error });
    }
};


// Récupérer les messages d'une conversation
exports.getMessages = async (req, res) => {
    const { userId } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, recipient: userId },
                { sender: userId, recipient: req.user.id }
            ]
        }).sort({ timestamp: 1 })
            .populate('sender', 'name');

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages', error });
    }
};