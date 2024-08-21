const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Charger les variables d'environnement
dotenv.config();

// Connecter à MongoDB
connectDB();

const app = express();

// Middleware pour parser le corps des requêtes JSON
app.use(express.json());

// Importer les routes utilisateurs
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));