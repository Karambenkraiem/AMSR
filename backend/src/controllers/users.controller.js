const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const getAll = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nom: true, prenom: true, email: true, role: true, matricule: true, centrale: true, active: true, createdAt: true },
    orderBy: { nom: 'asc' },
  });
  res.json(users);
};

const getByRole = async (req, res) => {
  const { role } = req.params;
  const users = await prisma.user.findMany({
    where: { role, active: true },
    select: { id: true, nom: true, prenom: true, email: true, role: true, matricule: true },
    orderBy: { nom: 'asc' },
  });
  res.json(users);
};

const create = async (req, res) => {
  const { nom, prenom, email, role, matricule, centrale, password } = req.body;
  if (!nom || !prenom || !email || !role || !matricule || !password) return res.status(400).json({ error: 'Champs requis manquants' });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { matricule }] },
  });
  if (existing) {
    if (existing.email === email) return res.status(400).json({ error: 'Email déjà utilisé' });
    return res.status(400).json({ error: 'Matricule déjà utilisé' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nom, prenom, email, password: hashed, role, matricule, centrale: centrale || 'Centrale Goulette 2' },
    select: { id: true, nom: true, prenom: true, email: true, role: true, matricule: true, centrale: true, active: true },
  });
  res.status(201).json(user);
};

const update = async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, role, matricule, centrale, active, password } = req.body;

  const data = {};
  if (nom) data.nom = nom;
  if (prenom) data.prenom = prenom;
  if (email) data.email = email;
  if (role) data.role = role;
  if (matricule !== undefined) data.matricule = matricule;
  if (centrale) data.centrale = centrale;
  if (active !== undefined) data.active = active;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data,
    select: { id: true, nom: true, prenom: true, email: true, role: true, matricule: true, centrale: true, active: true },
  });
  res.json(user);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const uid = parseInt(id);

  if (req.user.id === uid) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });

  // Suppression en cascade manuelle (ordre FK)
  await prisma.notification.deleteMany({ where: { userId: uid } });
  await prisma.delegation.deleteMany({ where: { OR: [{ delegantId: uid }, { delegueId: uid }] } });
  await prisma.commentaireSecurite.deleteMany({ where: { auteurId: uid } });

  // Détacher les demandes où cet utilisateur est assistant
  await prisma.demande.updateMany({ where: { assistantChargeTravauxId: uid }, data: { assistantChargeTravauxId: null, assistantNom: null } });

  // Si CT principal sur une demande → supprimer toute la chaîne
  const demandes = await prisma.demande.findMany({ where: { chargeTravauxId: uid }, select: { id: true } });
  for (const d of demandes) {
    const att = await prisma.attestation.findUnique({ where: { demandeId: d.id } });
    if (att) {
      await prisma.interruption.deleteMany({ where: { attestationId: att.id } });
      await prisma.changementCharge.deleteMany({ where: { attestationId: att.id } });
      await prisma.commentaireSecurite.deleteMany({ where: { attestationId: att.id } });
      await prisma.attestation.delete({ where: { id: att.id } });
    }
    await prisma.notification.deleteMany({ where: { demandeId: d.id } });
    await prisma.commentaireSecurite.deleteMany({ where: { demandeId: d.id } });
    await prisma.demande.delete({ where: { id: d.id } });
  }

  await prisma.user.delete({ where: { id: uid } });
  res.json({ message: 'Utilisateur supprimé définitivement' });
};

module.exports = { getAll, getByRole, create, update, remove };
