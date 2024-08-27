const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const User = require('../models/userModel');

const router = express.Router();

// Route pour définir un utilisateur comme modérateur
router.put('/set-moderator/:id', authMiddleware, adminMiddleware, async (req, res) => {
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
});

module.exports = router;
