const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = [
    { nom: 'Administrateur', prenom: 'Système', email: 'admin@steg.com.tn', password: hashedPassword, role: 'admin', matricule: 'ADMIN001', centrale: 'Centrale Goulette 2' },
  ];

  for (const user of users) {
    // Chercher par email OU par matricule pour éviter les conflits
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: user.email }, { matricule: user.matricule }] },
    });
    if (existing) continue; // Déjà présent, on ne touche pas

    await prisma.user.create({ data: user });
  }

  console.log('Seeding completed. Admin login: ADMIN001 / 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
