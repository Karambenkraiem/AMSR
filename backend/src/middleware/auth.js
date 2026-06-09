const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.active) return res.status(401).json({ error: 'Utilisateur non autorisé' });

    // Vérifier les délégations actives pour cet utilisateur
    const now = new Date();
    const delegations = await prisma.delegation.findMany({
      where: {
        delegueId: user.id,
        active: true,
        dateDebut: { lte: now },
        dateFin: { gte: now },
      },
    });
    const delegatedRoles = delegations.map((d) => d.role);

    req.user = { ...user, delegatedRoles };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

// Helper partagé : est-ce que l'utilisateur peut agir avec ce rôle ?
const canActAs = (user, role) => {
  if (user.role === 'admin') return true;
  if (user.role === 'chef_centrale') return true; // chef peut tout faire
  if (user.role === role) return true;
  if (user.delegatedRoles?.includes(role)) return true;
  // Privilèges étendus fixes
  if (role === 'charge_travaux' && ['chef_maintenance', 'charge_consignation'].includes(user.role)) return true;
  return false;
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé: rôle insuffisant' });
  }
  next();
};

module.exports = { authenticate, authorize, canActAs };
