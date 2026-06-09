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
  if (!nom || !prenom || !email || !role || !password) return res.status(400).json({ error: 'Champs requis manquants' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

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
  await prisma.user.update({ where: { id: parseInt(id) }, data: { active: false } });
  res.json({ message: 'Utilisateur désactivé' });
};

module.exports = { getAll, getByRole, create, update, remove };
