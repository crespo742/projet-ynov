const express = require('express');
const router = express.Router();
const { register, login, getUser, getUserProfile } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   POST /api/users/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/users/user
// @desc    Get logged in user
// @access  Private
router.get('/user', authMiddleware, getUser);

module.exports = router;
