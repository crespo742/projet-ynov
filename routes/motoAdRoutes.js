const express = require('express');
const router = express.Router();
const { createMotoAd, getMotoAds, getMotoAdById, updateMotoAd, deleteMotoAd, getUserMotoAds, getFilteredMotoAds } = require('../controllers/motoAdController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Créer une annonce
router.post('/create', authMiddleware, upload.single('image'), createMotoAd);

// Obtenir toutes les annonces
router.get('/', getMotoAds);

// Obtenir toutes les annonces
router.get('/filter', getFilteredMotoAds);

// Obtenir les annonces de motos de l'utilisateur connecté
router.get('/my-ads', authMiddleware, getUserMotoAds);

// Obtenir une annonce par ID
router.get('/:id', getMotoAdById);

// Mettre à jour une annonce
router.put('/:id', authMiddleware, updateMotoAd);

// Supprimer une annonce
router.delete('/:id', authMiddleware, deleteMotoAd);

module.exports = router;
