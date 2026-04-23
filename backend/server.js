require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📌 Base de données : ${process.env.DB_NAME}`);
  });
}

start().catch(err => {
  console.error('❌ Erreur démarrage:', err.message);
  process.exit(1);
});