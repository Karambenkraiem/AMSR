const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Super admin — créé seulement si la base est vide
  const existing = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!existing) {
    console.log('Première initialisation de la base de données...');
    const hashedAdmin = await bcrypt.hash('Admin@2024', 10);
    await prisma.user.create({
      data: {
        nom: 'Administrateur',
        prenom: 'Système',
        email: 'admin@steg.com.tn',
        password: hashedAdmin,
        role: 'admin',
        matricule: 'ADM001',
        centrale: 'Centrale Goulette 2',
        active: true,
      },
    });
    console.log('Super admin créé : ADM001 / Admin@2024');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
