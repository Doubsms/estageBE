// prisma/client.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Tester la connexion
prisma.$connect()
  .then(() => console.log('✅ Connecté à la base de données via Prisma'))
  .catch(err => {
    console.error('❌ Erreur de connexion Prisma:', err.message);
    process.exit(1);
  });

module.exports = prisma;