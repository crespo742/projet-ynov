const express = require('express');
const router = express.Router();
const { createMotoAd, getMotoAds, getMotoAdById, updateMotoAd, deleteMotoAd, getUserMotoAds, getFilteredMotoAds, getUserMotoAdsById } = require('../controllers/motoAdController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Créer une annonce
router.post('/create', authMiddleware, upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), createMotoAd);

// Obtenir toutes les annonces
router.get('/', getMotoAds);

// Obtenir toutes les annonces
router.get('/filter', getFilteredMotoAds);

// Obtenir une annonce par ID
router.get('/:id', getMotoAdById);

// Obtenir les annonces de motos de l'utilisateur connecté
router.get('/my-ads', authMiddleware, getUserMotoAds);

// Obtenir les annonces d'un utilisateur spécifique (par ID d'utilisateur)
router.get('/my-ads/:id', authMiddleware, getUserMotoAdsById);

// Mettre à jour une annonce (y compris les images)
router.put('/:id', authMiddleware, upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), updateMotoAd);


// Supprimer une annonce
router.delete('/:id', authMiddleware, deleteMotoAd);

module.exports = router;
