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
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

  const { password: _, ...userSafe } = user;
  const delegatedRoles = await getActiveDelegatedRoles(user.id);
  res.json({ token, user: { ...userSafe, delegatedRoles } });
};

const me = async (req, res) => {
  const { password: _, ...userSafe } = req.user;
  // delegatedRoles already injected by auth middleware
  res.json(userSafe);
};

const changePassword = async (req, res) => {
  const { ancienMotDePasse, nouveauMotDePasse } = req.body;
  if (!ancienMotDePasse || !nouveauMotDePasse) return res.status(400).json({ error: 'Champs requis manquants' });

  const valid = await bcrypt.compare(ancienMotDePasse, req.user.password);
  if (!valid) return res.status(400).json({ error: 'Ancien mot de passe incorrect' });

  const hashed = await bcrypt.hash(nouveauMotDePasse, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
  res.json({ message: 'Mot de passe modifié avec succès' });
};

module.exports = { login, me, changePassword };
