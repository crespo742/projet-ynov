const express = require('express');
const router = express.Router();
const { 
    createMotoAnnonce,
    getMotoAnnonces,
    getMotoAnnonceById,
    updateMotoAnnonce,
    deleteMotoAnnonce,
    getUserMotoAnnonces,
    getFilteredMotoAnnonces,
    getUserMotoAnnoncesById
} = require('../controllers/motoAnnonceController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Créer une annonce
router.post('/create', authMiddleware, upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), createMotoAnnonce);

// Obtenir toutes les annonces
router.get('/', getMotoAnnonces);

// Obtenir toutes les annonces
router.get('/filter', getFilteredMotoAnnonces);

// Obtenir une annonce par ID
router.get('/:id', getMotoAnnonceById);

// Obtenir les annonces de motos de l'utilisateur connecté
router.get('/my-Annonces', authMiddleware, getUserMotoAnnonces);

// Obtenir les annonces d'un utilisateur spécifique (par ID d'utilisateur)
router.get('/my-Annonces/:id', authMiddleware, getUserMotoAnnoncesById);

// Mettre à jour une annonce (y compris les images)
router.put('/:id', authMiddleware, upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), updateMotoAnnonce);


// Supprimer une annonce
router.delete('/:id', authMiddleware, deleteMotoAnnonce);

module.exports = router;
