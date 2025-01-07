const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    telephone: {
        type: String,
        required: false,
    },
    isModo: {
        type: Boolean,
        default: false,  // Par défaut, un utilisateur n'est pas modérateur
    },
    isAdmin: {
        type: Boolean,
        default: false,  // Par défaut, un utilisateur n'est pas admin
    },
    rating: {
        type: Number,
        default: 0
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    ratedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    motoAnnonces: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MotoAnnonce',
        default: [],  // Initialisation à un tableau vide par défaut
    }],
    stripeCustomerId: {
        type: String,
        required: false, // Ce champ est facultatif, utilisé pour les paiements Stripe
    },
}, {
    timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
