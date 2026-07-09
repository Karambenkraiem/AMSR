require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const demandesRoutes = require('./routes/demandes.routes');
const attestationsRoutes = require('./routes/attestations.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const delegationsRoutes = require('./routes/delegations.routes');
const commentairesSecuriteRoutes = require('./routes/commentairesSecurite.routes');
const configRoutes = require('./routes/config.routes');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5175', 'http://amsr_frontend:5175'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/attestations', attestationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/delegations', delegationsRoutes);
app.use('/api/commentaires-securite', commentairesSecuriteRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
});

app.listen(PORT, () => console.log(`Serveur AMSR démarré sur le port ${PORT}`));
