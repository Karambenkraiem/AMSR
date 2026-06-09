const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const userSelect = { id: true, nom: true, prenom: true, matricule: true, role: true };

const delegationInclude = {
  delegant: { select: userSelect },
  delegue: { select: userSelect },
};

// Liste des délégations (CE voit les siennes, admin voit tout)
const getAll = async (req, res) => {
  const where = {};
  if (!['admin', 'chef_centrale'].includes(req.user.role)) {
    where.delegantId = req.user.id;
  }
  const delegations = await prisma.delegation.findMany({
    where,
    include: delegationInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(delegations);
};

// Créer une délégation
const create = async (req, res) => {
  if (!['charge_exploitation', 'admin', 'chef_centrale'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Seul le chargé d\'exploitation peut déléguer ce rôle' });
  }

  const { delegueId, role, dateDebut, dateFin, note } = req.body;
  if (!delegueId || !role || !dateDebut || !dateFin) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  if (new Date(dateFin) <= new Date(dateDebut)) {
    return res.status(400).json({ error: 'La date de fin doit être postérieure à la date de début' });
  }
  if (parseInt(delegueId) === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous déléguer à vous-même' });
  }

  const delegue = await prisma.user.findUnique({ where: { id: parseInt(delegueId) } });
  if (!delegue || !delegue.active) {
    return res.status(404).json({ error: 'Utilisateur introuvable ou inactif' });
  }

  const delegation = await prisma.delegation.create({
    data: {
      delegantId: req.user.id,
      delegueId: parseInt(delegueId),
      role,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      note,
    },
    include: delegationInclude,
  });

  // Notifier le délégué
  await prisma.notification.create({
    data: {
      userId: parseInt(delegueId),
      message: `${req.user.prenom} ${req.user.nom} vous délègue le rôle "${role.replace(/_/g, ' ')}" du ${new Date(dateDebut).toLocaleString('fr-TN')} au ${new Date(dateFin).toLocaleString('fr-TN')}.`,
      type: 'delegation_recue',
    },
  });

  res.status(201).json(delegation);
};

// Révoquer une délégation
const revoke = async (req, res) => {
  const { id } = req.params;
  const delegation = await prisma.delegation.findUnique({ where: { id: parseInt(id) } });
  if (!delegation) return res.status(404).json({ error: 'Délégation introuvable' });

  const canRevoke = delegation.delegantId === req.user.id || req.user.role === 'admin';
  if (!canRevoke) return res.status(403).json({ error: 'Non autorisé' });

  const updated = await prisma.delegation.update({
    where: { id: parseInt(id) },
    data: { active: false },
    include: delegationInclude,
  });

  // Notifier le délégué
  await prisma.notification.create({
    data: {
      userId: delegation.delegueId,
      message: `La délégation de rôle "${delegation.role.replace(/_/g, ' ')}" vous a été révoquée par ${req.user.prenom} ${req.user.nom}.`,
      type: 'delegation_revoquee',
    },
  });

  res.json(updated);
};

module.exports = { getAll, create, revoke };
