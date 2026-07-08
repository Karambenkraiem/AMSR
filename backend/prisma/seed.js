const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@2024';

const DEMO_USERS = [
  {
    matricule: 'DEMO-EXP',
    nom: 'Ben Youssef',
    prenom: 'Mohamed',
    email: 'demo.exploitation@steg.com.tn',
    role: 'charge_exploitation',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-TRV',
    nom: 'Maaloul',
    prenom: 'Sonia',
    email: 'demo.travaux@steg.com.tn',
    role: 'charge_travaux',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-TRV2',
    nom: 'Jendoubi',
    prenom: 'Karim',
    email: 'demo.travaux2@steg.com.tn',
    role: 'charge_travaux',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-CSG',
    nom: 'Trabelsi',
    prenom: 'Farouk',
    email: 'demo.consignation@steg.com.tn',
    role: 'charge_consignation',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-CHF',
    nom: 'Chaabane',
    prenom: 'Nadia',
    email: 'demo.chef@steg.com.tn',
    role: 'chef_centrale',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-CHM',
    nom: 'Gharbi',
    prenom: 'Slim',
    email: 'demo.maintenance@steg.com.tn',
    role: 'chef_maintenance',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-DIR',
    nom: 'Khemiri',
    prenom: 'Amel',
    email: 'demo.directeur@steg.com.tn',
    role: 'directeur',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-ANS',
    nom: 'Ferjani',
    prenom: 'Yassine',
    email: 'demo.animateur@steg.com.tn',
    role: 'animateur_securite',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-RES',
    nom: 'Bouazizi',
    prenom: 'Ines',
    email: 'demo.responsable@steg.com.tn',
    role: 'responsable_securite',
    centrale: 'Centrale Goulette 2',
  },
  {
    matricule: 'DEMO-GST',
    nom: 'Invité',
    prenom: 'Compte',
    email: 'demo.guest@steg.com.tn',
    role: 'guest',
    centrale: 'Centrale Goulette 2',
  },
];

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

  // Comptes de démonstration — toujours synchronisés (upsert idempotent)
  console.log('Synchronisation des comptes de démonstration...');
  const hashedDemo = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { matricule: u.matricule },
      update: { password: hashedDemo, active: true },
      create: { ...u, password: hashedDemo, active: true },
    });
    console.log(`  ✓ ${u.matricule} — ${u.prenom} ${u.nom} (${u.role})`);
  }

  console.log(`\nComptes démo : mot de passe = ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
