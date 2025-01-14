const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // Utilisation de socket.io pour WebSocket
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const connectDB = require('./config/database');
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONT_BASE_URL, // Domaine du frontend
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json()); // Middleware pour parser le JSON

// Importation des routes
const userRoutes = require('./routes/userRoutes');
const motoAnnonceRoutes = require('./routes/motoAnnonceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

// Utilisation des routes
app.use('/api/users', userRoutes);
app.use('/api/moto-Annonces', motoAnnonceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rentals', rentalRoutes);

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Écoute des messages envoyés par les utilisateurs
  socket.on('sendMessage', async (messageData) => {
    const { sender, receiver, content } = messageData;

    // Sauvegarde du message dans MongoDB
    const message = new Message({
      sender,
      recipient: receiver,
      content,
    });

    await message.save();

    // Émet le message à l'utilisateur destinataire
    io.to(receiver).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
