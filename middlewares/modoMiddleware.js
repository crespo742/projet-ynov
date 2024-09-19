const User = require('../models/userModel');

const modoMiddleware = async (req, res, next) => {    
    try {
        console.log("error");
        const user = await User.findById(req.user.id);
        if (user && user.isModo) {
            console.log('prout');
            next();  // Si l'utilisateur est modo, continuer
        } else {
            return res.status(403).json({ message: 'Access denied. Modos only.' });
        }
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = modoMiddleware;