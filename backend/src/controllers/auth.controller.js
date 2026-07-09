const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const getActiveDelegatedRoles = async (userId) => {
  const now = new Date();
  const delegations = await prisma.delegation.findMany({
    where: { delegueId: userId, active: true, dateDebut: { lte: now }, dateFin: { gte: now } },
  });
  return delegations.map((d) => d.role);
};

const login = async (req, res) => {
  const { matricule, password } = req.body;
  if (!matricule || !password) return res.status(400).json({ error: 'Matricule et mot de passe requis' });

  const user = await prisma.user.findUnique({ where: { matricule } });
  if (!user || !user.active) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

  const { password: _, ...userSafe } = user;
  const delegatedRoles = await getActiveDelegatedRoles(user.id);
  res.json({ token, user: { ...userSafe, delegatedRoles } });
};

const quickLogin = async (req, res) => {
  try {
    const config = await prisma.appConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    if (!config.demoModeEnabled) return res.status(403).json({ error: 'Mode démo désactivé' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requis' });

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user || !user.active) return res.status(401).json({ error: 'Compte introuvable ou inactif' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const { password: _, ...userSafe } = user;
    const delegatedRoles = await getActiveDelegatedRoles(user.id);
    res.json({ token, user: { ...userSafe, delegatedRoles } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la connexion démo' });
  }
};

const me = async (req, res) => {
  const { password: _, ...userSafe } = req.user;
  // delegatedRoles already injected by auth middleware
  res.json(userSafe);
};

const changePassword = async (req, res) => {
  if (req.user.role === 'guest') return res.status(403).json({ error: 'Non autorisé pour ce rôle' });

  const { ancienMotDePasse, nouveauMotDePasse } = req.body;
  if (!ancienMotDePasse || !nouveauMotDePasse) return res.status(400).json({ error: 'Champs requis manquants' });

  const valid = await bcrypt.compare(ancienMotDePasse, req.user.password);
  if (!valid) return res.status(400).json({ error: 'Ancien mot de passe incorrect' });

  const hashed = await bcrypt.hash(nouveauMotDePasse, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
  res.json({ message: 'Mot de passe modifié avec succès' });
};

const updateProfile = async (req, res) => {
  if (req.user.role === 'guest') return res.status(403).json({ error: 'Non autorisé pour ce rôle' });

  const { nom, prenom, email } = req.body;
  if (!nom || !prenom || !email) return res.status(400).json({ error: 'Champs requis manquants' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== req.user.id) return res.status(400).json({ error: 'Email déjà utilisé' });

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { nom, prenom, email },
    select: { id: true, nom: true, prenom: true, email: true, matricule: true, role: true, centrale: true, active: true },
  });
  res.json(updated);
};

module.exports = { login, quickLogin, me, changePassword, updateProfile };
