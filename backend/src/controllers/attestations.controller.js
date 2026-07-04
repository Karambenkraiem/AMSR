const { PrismaClient } = require('@prisma/client');
const { canActAs } = require('../middleware/auth');

const prisma = new PrismaClient();

const userSelect = { id: true, nom: true, prenom: true, matricule: true, role: true };

const attestationInclude = {
  demande: {
    include: { chargeTravaux: { select: userSelect } },
  },
  accordExploitation: { select: userSelect },
  regimeExecute: { select: userSelect },
  regimeDelivre: { select: userSelect },
  assistantDelivre: { select: userSelect },
  operationTerminee: { select: userSelect },
  regimeLeve: { select: userSelect },
  changements: { include: { remplace: { select: userSelect } }, orderBy: { createdAt: 'asc' } },
  interruptions: { orderBy: { createdAt: 'asc' } },
};

const getAll = async (req, res) => {
  const attestations = await prisma.attestation.findMany({
    include: attestationInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(attestations);
};

const getOne = async (req, res) => {
  const { id } = req.params;
  const att = await prisma.attestation.findUnique({ where: { id: parseInt(id) }, include: attestationInclude });
  if (!att) return res.status(404).json({ error: 'Attestation introuvable' });
  res.json(att);
};

// Chargé d'Exploitation: accord
const accorderExploitation = async (req, res) => {
  const { id } = req.params;
  if (!canActAs(req.user, 'charge_exploitation')) {
    return res.status(403).json({ error: 'Seul le chargé d\'exploitation peut accorder' });
  }

  const att = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      accordExploitationId: req.user.id,
      accordDate: new Date(),
      status: 'accord_exploitation',
    },
  });

  await prisma.demande.update({ where: { id: att.demandeId }, data: { status: 'accord_exploitation' } });

  // Notify charge_consignation
  const consignateurs = await prisma.user.findMany({ where: { role: 'charge_consignation', active: true } });
  await prisma.notification.createMany({
    data: consignateurs.map((u) => ({
      userId: u.id,
      message: `Attestation N° ${att.numero}: accord d'exploitation obtenu. Procéder à la consignation.`,
      type: 'consignation_requise',
      demandeId: att.demandeId,
    })),
  });

  res.json(att);
};

// Chargé de Consignation: confirme régime exécuté
const confirmerRegimeExecute = async (req, res) => {
  const { id } = req.params;
  if (!canActAs(req.user, 'charge_consignation')) {
    return res.status(403).json({ error: 'Seul le chargé de consignation peut confirmer' });
  }

  const att = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      regimeExecuteId: req.user.id,
      regimeExecuteDate: new Date(),
      status: 'regime_execute',
    },
  });

  await prisma.demande.update({ where: { id: att.demandeId }, data: { status: 'regime_execute' } });

  // Notify charge_travaux
  const demande = await prisma.demande.findUnique({ where: { id: att.demandeId } });
  await prisma.notification.create({
    data: {
      userId: demande.chargeTravauxId,
      message: `Attestation N° ${att.numero}: consignations OK. Vous pouvez démarrer vos travaux.`,
      type: 'regime_execute',
      demandeId: att.demandeId,
    },
  });

  res.json(att);
};

// Chargé de Travaux: accepte le régime — si assistant désigné, attente de sa confirmation
const demarrerTravaux = async (req, res) => {
  const { id } = req.params;
  const { assistantId } = req.body;

  let assistantData = {};
  let hasAssistant = false;

  if (assistantId) {
    const assistant = await prisma.user.findUnique({ where: { id: parseInt(assistantId) } });
    if (assistant) {
      assistantData = {
        assistantDelivreId: assistant.id,
        assistantDelivreNom: `${assistant.prenom} ${assistant.nom}`,
      };
      hasAssistant = true;
    }
  }

  // Si assistant désigné → attente confirmation ; sinon → démarrage direct
  const newStatus = hasAssistant ? 'attente_confirmation_assistant' : 'en_cours';

  const att = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      regimeDelivreId: req.user.id,
      regimeDelivreDate: hasAssistant ? null : new Date(), // Date fixée à la confirmation si assistant
      ...assistantData,
      status: newStatus,
    },
  });

  await prisma.demande.update({ where: { id: att.demandeId }, data: { status: newStatus } });

  if (hasAssistant) {
    await prisma.notification.create({
      data: {
        userId: parseInt(assistantId),
        message: `${req.user.prenom} ${req.user.nom} vous demande de confirmer votre participation pour démarrer les travaux N° ${att.numero}. Votre confirmation est requise.`,
        type: 'confirmation_requise',
        demandeId: att.demandeId,
      },
    });
  }

  res.json(att);
};

// Assistant CT : confirme sa participation → les travaux démarrent
const confirmerAssistant = async (req, res) => {
  const { id } = req.params;

  const att = await prisma.attestation.findUnique({
    where: { id: parseInt(id) },
    include: { demande: true },
  });

  if (!att) return res.status(404).json({ error: 'Attestation introuvable' });
  if (att.status !== 'attente_confirmation_assistant') {
    return res.status(400).json({ error: 'Aucune confirmation d\'assistant attendue pour cette attestation' });
  }
  if (att.assistantDelivreId !== req.user.id) {
    return res.status(403).json({ error: 'Vous n\'êtes pas l\'assistant désigné pour cette opération' });
  }

  const updated = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      regimeDelivreDate: new Date(), // L'heure réelle de démarrage
      status: 'en_cours',
    },
    include: attestationInclude,
  });

  await prisma.demande.update({ where: { id: att.demandeId }, data: { status: 'en_cours' } });

  // Notifier le CT principal que l'assistant a confirmé
  if (att.regimeDelivreId) {
    await prisma.notification.create({
      data: {
        userId: att.regimeDelivreId,
        message: `${req.user.prenom} ${req.user.nom} a confirmé sa participation. Les travaux N° ${att.numero} sont maintenant en cours.`,
        type: 'assistant_confirme',
        demandeId: att.demandeId,
      },
    });
  }

  res.json(updated);
};

// Chargé de Travaux: déclare opération terminée
const terminerOperation = async (req, res) => {
  const { id } = req.params;
  const { assistantTermineeNom } = req.body;

  // Vérifier les droits : CT qui a accepté le régime, CT actuel (après changement), chef_centrale ou admin
  const attCheck = await prisma.attestation.findUnique({
    where: { id: parseInt(id) },
    include: { demande: true },
  });
  if (!attCheck) return res.status(404).json({ error: 'Attestation introuvable' });

  const isCurrentCT = attCheck.demande.chargeTravauxId === req.user.id;
  const isChefCentrale = ['chef_centrale', 'admin'].includes(req.user.role);

  if (!isCurrentCT && !isChefCentrale) {
    return res.status(403).json({
      error: 'Seul le chargé de travaux affecté à cette demande peut déclarer l\'opération terminée',
    });
  }

  const att = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      operationTermineeId: req.user.id,
      operationTermineeDate: new Date(),
      assistantTermineeNom,
      status: 'operation_terminee',
    },
  });

  await prisma.demande.update({ where: { id: att.demandeId }, data: { status: 'operation_terminee' } });

  // Notify charge_consignation
  const consignateurs = await prisma.user.findMany({ where: { role: 'charge_consignation', active: true } });
  await prisma.notification.createMany({
    data: consignateurs.map((u) => ({
      userId: u.id,
      message: `Attestation N° ${att.numero}: travaux terminés. Procéder au régime levé.`,
      type: 'regime_leve_requis',
      demandeId: att.demandeId,
    })),
  });

  res.json(att);
};

// Chargé de Consignation: lève le régime (fermeture)
const leverRegime = async (req, res) => {
  const { id } = req.params;
  if (!canActAs(req.user, 'charge_consignation')) {
    return res.status(403).json({ error: 'Seul le chargé de consignation peut lever le régime' });
  }

  const att = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      regimeleveId: req.user.id,
      regimeleveDate: new Date(),
      status: 'cloturee',
    },
  });

  await prisma.demande.update({ where: { id: att.demandeId }, data: { status: 'cloturee' } });

  res.json(att);
};

// Mise à jour du contenu de l'attestation (par chargé de consignation)
const updateAttestation = async (req, res) => {
  const { id } = req.params;
  const { codeBdm, ouvrageDesignation, local, repere, manoeuvresCondamnation, instructions,
    serviceDemandeur,
    permisFeu, permisFouille, permisControleRadio, permisAcces } = req.body;

  const att = await prisma.attestation.update({
    where: { id: parseInt(id) },
    data: {
      codeBdm, ouvrageDesignation, local, repere, manoeuvresCondamnation,
      instructions: instructions || [],
      permisFeu: permisFeu !== undefined ? !!permisFeu : undefined,
      permisFouille: permisFouille !== undefined ? !!permisFouille : undefined,
      permisControleRadio: permisControleRadio !== undefined ? !!permisControleRadio : undefined,
      permisAcces: permisAcces !== undefined ? !!permisAcces : undefined,
    },
    include: attestationInclude,
  });

  // Mettre à jour le service demandeur sur la demande si fourni
  if (serviceDemandeur !== undefined) {
    await prisma.demande.update({
      where: { id: att.demandeId },
      data: { serviceDemandeur },
    });
  }

  res.json(att);
};

module.exports = {
  getAll, getOne, accorderExploitation, confirmerRegimeExecute,
  demarrerTravaux, confirmerAssistant, terminerOperation, leverRegime, updateAttestation,
};
