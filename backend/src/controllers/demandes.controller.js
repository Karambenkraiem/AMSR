const { PrismaClient } = require('@prisma/client');
const { canActAs } = require('../middleware/auth');

const prisma = new PrismaClient();

const generateNumero = async () => {
  const count = await prisma.demande.count();
  const num = count + 1;
  return `DMSR-${String(num).padStart(5, '0')}`;
};

const userSelect = { id: true, nom: true, prenom: true, matricule: true, role: true };

const include = {
  chargeTravaux: { select: userSelect },
  assistantChargeTravaux: { select: userSelect },
  attestation: {
    include: {
      accordExploitation: { select: userSelect },
      regimeExecute: { select: userSelect },
      regimeDelivre: { select: userSelect },
      assistantDelivre: { select: userSelect },
      operationTerminee: { select: userSelect },
      regimeLeve: { select: userSelect },
      changements: { include: { remplace: { select: userSelect } } },
      interruptions: true,
    },
  },
};

const getAll = async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;

  const demandes = await prisma.demande.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  });
  res.json(demandes);
};

const getOne = async (req, res) => {
  const { id } = req.params;
  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) }, include });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });
  res.json(demande);
};

const create = async (req, res) => {
  const {
    designationOperation, tr, tg, niveau, ouvragesConcernes,
    datePrevu, dureePrevu, instructionsParticulieres,
    typeBon, numeroBon, regimeType, serviceDemandeur,
    assistantId,
    permisFeu, permisControle, permisAcces, permisRadiographique, permisFouille,
  } = req.body;

  if (!designationOperation || !regimeType) {
    return res.status(400).json({ error: 'Désignation de l\'opération et type de régime requis' });
  }

  // Résoudre l'assistant CT si un ID est fourni
  let assistantNom = null;
  let assistantChargeTravauxId = null;
  if (assistantId) {
    const assistant = await prisma.user.findUnique({ where: { id: parseInt(assistantId) } });
    if (assistant && assistant.role === 'charge_travaux') {
      assistantChargeTravauxId = assistant.id;
      assistantNom = `${assistant.prenom} ${assistant.nom}`;
    }
  }

  const numero = await generateNumero();

  const demande = await prisma.demande.create({
    data: {
      numero,
      centrale: req.user.centrale,
      designationOperation,
      tr, tg, niveau, ouvragesConcernes,
      datePrevu: datePrevu ? new Date(datePrevu) : null,
      dureePrevu,
      instructionsParticulieres,
      typeBon, numeroBon,
      regimeType,
      serviceDemandeur,
      assistantNom,
      assistantChargeTravauxId,
      permisFeu: !!permisFeu,
      permisControle: !!permisControle,
      permisAcces: !!permisAcces,
      permisRadiographique: !!permisRadiographique,
      permisFouille: !!permisFouille,
      chargeTravauxId: req.user.id,
    },
    include,
  });

  // Notifier CE et CC
  const notifyRoles = ['charge_exploitation', 'charge_consignation'];
  const targets = await prisma.user.findMany({ where: { role: { in: notifyRoles }, active: true } });
  await prisma.notification.createMany({
    data: targets.map((u) => ({
      userId: u.id,
      message: `Nouvelle demande de mise sous régime N° ${numero} soumise par ${req.user.prenom} ${req.user.nom}`,
      type: 'nouvelle_demande',
      demandeId: demande.id,
    })),
  });

  // Notifier l'assistant CT désigné
  if (assistantChargeTravauxId) {
    await prisma.notification.create({
      data: {
        userId: assistantChargeTravauxId,
        message: `Vous avez été désigné assistant Chargé de Travaux par ${req.user.prenom} ${req.user.nom} pour la demande N° ${numero}.`,
        type: 'assistant_designe',
        demandeId: demande.id,
      },
    });
  }

  res.status(201).json(demande);
};

const initAttestation = async (req, res) => {
  const { id } = req.params;
  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) }, include });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });
  if (demande.attestation) return res.status(400).json({ error: 'Attestation déjà créée' });

  const { codeBdm, ouvrageDesignation, local, repere, manoeuvresCondamnation, instructions,
    serviceDemandeur,
    permisFeu, permisFouille, permisControleRadio, permisAcces } = req.body;

  const attestation = await prisma.attestation.create({
    data: {
      numero: demande.numero,
      demandeId: demande.id,
      codeBdm, ouvrageDesignation, local, repere, manoeuvresCondamnation,
      instructions: instructions || [],
      permisFeu: !!permisFeu,
      permisFouille: !!permisFouille,
      permisControleRadio: !!permisControleRadio,
      permisAcces: !!permisAcces,
      status: 'en_cours_attestation',
    },
  });

  await prisma.demande.update({
    where: { id: demande.id },
    data: {
      status: 'en_cours_attestation',
      ...(serviceDemandeur !== undefined ? { serviceDemandeur } : {}),
    },
  });

  // Notify charge_exploitation
  const exploitants = await prisma.user.findMany({ where: { role: 'charge_exploitation', active: true } });
  await prisma.notification.createMany({
    data: exploitants.map((u) => ({
      userId: u.id,
      message: `L'attestation N° ${demande.numero} est prête pour votre accord`,
      type: 'accord_requis',
      demandeId: demande.id,
    })),
  });

  res.status(201).json(attestation);
};

const arretTemporaire = async (req, res) => {
  const { id } = req.params;
  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) }, include });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });
  if (!demande.attestation) return res.status(400).json({ error: 'Attestation introuvable' });

  const { ouvrageDisponible, dateArret, heureArret, chargeTravauxArretNom,
    chargeConsignationArret1Nom, chargeConsignationArret2Nom, nomVisas } = req.body;

  const interruption = await prisma.interruption.create({
    data: {
      attestationId: demande.attestation.id,
      ouvrageDisponible: !!ouvrageDisponible,
      dateArret: dateArret ? new Date(dateArret) : null,
      heureArret,
      chargeTravauxArretNom,
      chargeConsignationArret1Nom,
      chargeConsignationArret2Nom,
      etatRegime: 'suspendu',
      nomVisas,
    },
  });

  await prisma.demande.update({ where: { id: demande.id }, data: { status: 'arret_temporaire' } });
  await prisma.attestation.update({ where: { id: demande.attestation.id }, data: { status: 'arret_temporaire' } });

  res.json(interruption);
};

const reprendreOperations = async (req, res) => {
  const { id } = req.params;
  const { interruptionId, dateReprise, heureReprise, chargeTravauxRepriseNom,
    chargeConsignationReprise1Nom, chargeConsignationReprise2Nom } = req.body;

  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) }, include });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });

  await prisma.interruption.update({
    where: { id: parseInt(interruptionId) },
    data: {
      etatRegime: 'retabli',
      dateReprise: dateReprise ? new Date(dateReprise) : null,
      heureReprise,
      chargeTravauxRepriseNom,
      chargeConsignationReprise1Nom,
      chargeConsignationReprise2Nom,
    },
  });

  await prisma.demande.update({ where: { id: demande.id }, data: { status: 'en_cours' } });
  await prisma.attestation.update({ where: { id: demande.attestation.id }, data: { status: 'en_cours' } });

  res.json({ message: 'Opérations reprises' });
};

const changementCharge = async (req, res) => {
  const { id } = req.params;
  const { typeRole, remplacantNom, remplacantPrenom, dateEffet, remplacerId } = req.body;

  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) }, include });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });
  if (!demande.attestation) return res.status(400).json({ error: 'Attestation introuvable' });

  const changement = await prisma.changementCharge.create({
    data: {
      attestationId: demande.attestation.id,
      typeRole,
      remplacantNom,
      remplacantPrenom,
      dateEffet: dateEffet ? new Date(dateEffet) : new Date(),
      remplacerId: parseInt(remplacerId),
    },
  });

  if (typeRole === 'charge_travaux') {
    await prisma.demande.update({ where: { id: demande.id }, data: { chargeTravauxId: parseInt(remplacerId) } });
  }

  res.json(changement);
};

const adminUpdateStatus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé à l\'administrateur' });
  }
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    'soumise', 'en_cours_attestation', 'accord_exploitation', 'regime_execute',
    'attente_confirmation_assistant', 'en_cours', 'arret_temporaire',
    'operation_terminee', 'cloturee', 'rejetee',
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) }, include });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });

  const updated = await prisma.demande.update({
    where: { id: parseInt(id) },
    data: { status },
    include,
  });

  if (demande.attestation) {
    await prisma.attestation.update({
      where: { id: demande.attestation.id },
      data: { status },
    });
  }

  res.json(updated);
};

const updateAssistant = async (req, res) => {
  const { id } = req.params;
  const { assistantId } = req.body;

  const demande = await prisma.demande.findUnique({ where: { id: parseInt(id) } });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });

  let assistantChargeTravauxId = null;
  let assistantNom = null;

  if (assistantId) {
    const assistant = await prisma.user.findUnique({ where: { id: parseInt(assistantId) } });
    if (!assistant || assistant.role !== 'charge_travaux') {
      return res.status(400).json({ error: 'Utilisateur introuvable ou rôle incorrect' });
    }
    assistantChargeTravauxId = assistant.id;
    assistantNom = `${assistant.prenom} ${assistant.nom}`;
  }

  const updated = await prisma.demande.update({
    where: { id: parseInt(id) },
    data: { assistantChargeTravauxId, assistantNom },
    include,
  });

  // Notifier le nouvel assistant
  if (assistantChargeTravauxId) {
    await prisma.notification.create({
      data: {
        userId: assistantChargeTravauxId,
        message: `Vous avez été désigné assistant Chargé de Travaux par ${req.user.prenom} ${req.user.nom} pour la demande N° ${demande.numero}.`,
        type: 'assistant_designe',
        demandeId: demande.id,
      },
    });
  }

  res.json(updated);
};

const adminDelete = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Réservé à l\'administrateur' });
  const { id } = req.params;
  const did = parseInt(id);

  const demande = await prisma.demande.findUnique({ where: { id: did }, include: { attestation: true } });
  if (!demande) return res.status(404).json({ error: 'Demande introuvable' });

  if (demande.attestation) {
    await prisma.interruption.deleteMany({ where: { attestationId: demande.attestation.id } });
    await prisma.changementCharge.deleteMany({ where: { attestationId: demande.attestation.id } });
    await prisma.attestation.delete({ where: { id: demande.attestation.id } });
  }
  await prisma.notification.deleteMany({ where: { demandeId: did } });
  await prisma.demande.delete({ where: { id: did } });

  res.json({ message: 'Demande supprimée définitivement' });
};

module.exports = { getAll, getOne, create, initAttestation, arretTemporaire, reprendreOperations, changementCharge, updateAssistant, adminUpdateStatus, adminDelete };
