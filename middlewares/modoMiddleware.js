const User = require('../models/userModel');

const modoMiddleware = async (req, res, next) => {    
    try {
        const user = await User.findById(req.user.id);
        if (user && user.isModo) {
            next();  // Si l'utilisateur est modo, continuer
        } else {
            return res.status(403).json({ message: 'Access denied. Modos only.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = modoMiddleware;