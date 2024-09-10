const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',  // Vous pouvez utiliser d'autres services comme SendGrid ou Mailgun
    auth: {
        user: process.env.EMAIL_USER,  // L'adresse email de votre application
        pass: process.env.EMAIL_PASS,  // Le mot de passe ou clé API pour l'email
    },
});

module.exports = transporter;
