const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {    
    try {
        const user = await User.findById(req.user.id);
        if (user && user.isAdmin) {
            next();  // Si l'utilisateur est admin, continuer
        } else {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = adminMiddleware;