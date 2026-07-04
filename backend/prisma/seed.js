const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Si l'admin existe déjà → base déjà initialisée, on ne touche à rien
  const existing = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (existing) {
    console.log('Base déjà initialisée, seed ignoré.');
    return;
  }

  // Première initialisation : base vide → créer le super admin
  console.log('Première initialisation de la base de données...');
  const hashedPassword = await bcrypt.hash('Admin@2024', 10);

  await prisma.user.create({
    data: {
      nom: 'Administrateur',
      prenom: 'Système',
      email: 'admin@steg.com.tn',
      password: hashedPassword,
      role: 'admin',
      matricule: 'ADM001',
      centrale: 'Centrale Goulette 2',
      active: true,
    },
  });

  console.log('Super admin créé : matricule=ADM001 / mot de passe=Admin@2024');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
