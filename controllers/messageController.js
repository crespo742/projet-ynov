const Message = require('../models/messageModel');
const mongoose = require('mongoose');

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
        res.status(200).json(conversations);
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