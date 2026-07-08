const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CAN_READ = ['admin', 'animateur_securite', 'responsable_securite'];
const CAN_WRITE = ['admin', 'animateur_securite'];

const include = {
  auteur: { select: { id: true, nom: true, prenom: true, role: true } },
};

const getByDemande = async (req, res) => {
  if (!CAN_READ.includes(req.user.role)) return res.status(403).json({ error: 'Accès réservé aux rôles sécurité' });
  const demandeId = parseInt(req.params.demandeId);
  const commentaires = await prisma.commentaireSecurite.findMany({
    where: { demandeId },
    include,
    orderBy: { createdAt: 'desc' },
  });
  res.json(commentaires);
};

const getByAttestation = async (req, res) => {
  if (!CAN_READ.includes(req.user.role)) return res.status(403).json({ error: 'Accès réservé aux rôles sécurité' });
  const attestationId = parseInt(req.params.attestationId);
  const commentaires = await prisma.commentaireSecurite.findMany({
    where: { attestationId },
    include,
    orderBy: { createdAt: 'desc' },
  });
  res.json(commentaires);
};

const create = async (req, res) => {
  if (!CAN_WRITE.includes(req.user.role)) return res.status(403).json({ error: 'Seul l\'animateur sécurité peut ajouter un commentaire' });

  const { demandeId, attestationId, contenu } = req.body;
  if (!contenu || (!demandeId && !attestationId)) {
    return res.status(400).json({ error: 'Contenu et demande/attestation requis' });
  }

  const commentaire = await prisma.commentaireSecurite.create({
    data: {
      contenu,
      demandeId: demandeId ? parseInt(demandeId) : undefined,
      attestationId: attestationId ? parseInt(attestationId) : undefined,
      auteurId: req.user.id,
    },
    include,
  });
  res.status(201).json(commentaire);
};

module.exports = { getByDemande, getByAttestation, create };
