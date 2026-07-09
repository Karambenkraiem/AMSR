const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getConfig = async () => {
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return config;
};

const getDemoMode = async (req, res) => {
  try {
    const config = await getConfig();
    res.json({ enabled: config.demoModeEnabled });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const setDemoMode = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Réservé à l\'administrateur' });

    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'Champ "enabled" booléen requis' });

    const config = await prisma.appConfig.upsert({
      where: { id: 1 },
      update: { demoModeEnabled: enabled },
      create: { id: 1, demoModeEnabled: enabled },
    });
    res.json({ enabled: config.demoModeEnabled });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getQuickAccessUsers = async (req, res) => {
  try {
    const config = await getConfig();
    if (!config.demoModeEnabled) return res.json([]);

    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, nom: true, prenom: true, matricule: true, role: true },
      orderBy: [{ role: 'asc' }, { nom: 'asc' }],
    });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getDemoMode, setDemoMode, getQuickAccessUsers };
