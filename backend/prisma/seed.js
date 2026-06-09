const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin@2024', 10);

  const users = [
    { nom: 'Administrateur', prenom: 'Système', email: 'admin@steg.com.tn', password: hashedPassword, role: 'admin', matricule: 'ADM001', centrale: 'Centrale Goulette 2' },
    { nom: 'Ben Ali', prenom: 'Mohamed', email: 'ctravaux@steg.com.tn', password: hashedPassword, role: 'charge_travaux', matricule: 'CT001', centrale: 'Centrale Goulette 2' },
    { nom: 'Trabelsi', prenom: 'Ahmed', email: 'cconsignation@steg.com.tn', password: hashedPassword, role: 'charge_consignation', matricule: 'CC001', centrale: 'Centrale Goulette 2' },
    { nom: 'Mansouri', prenom: 'Sami', email: 'cexploitation@steg.com.tn', password: hashedPassword, role: 'charge_exploitation', matricule: 'CE001', centrale: 'Centrale Goulette 2' },
    { nom: 'Bouzid', prenom: 'Kamel', email: 'chef.centrale@steg.com.tn', password: hashedPassword, role: 'chef_centrale', matricule: 'CHC001', centrale: 'Centrale Goulette 2' },
    { nom: 'Hamdi', prenom: 'Riadh', email: 'chef.maintenance@steg.com.tn', password: hashedPassword, role: 'chef_maintenance', matricule: 'CHM001', centrale: 'Centrale Goulette 2' },
  ];

  for (const user of users) {
    // Chercher par email OU par matricule pour éviter les conflits
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: user.email }, { matricule: user.matricule }] },
    });
    if (existing) continue; // Déjà présent, on ne touche pas

    await prisma.user.create({ data: user });
  }

  console.log('Seeding completed. Default password for all users: Admin@2024');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
