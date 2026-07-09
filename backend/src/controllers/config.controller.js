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
  const config = await getConfig();
  res.json({ enabled: config.demoModeEnabled });
};

const setDemoMode = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Réservé à l\'administrateur' });

  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'Champ "enabled" booléen requis' });

  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    update: { demoModeEnabled: enabled },
    create: { id: 1, demoModeEnabled: enabled },
  });
  res.json({ enabled: config.demoModeEnabled });
};

module.exports = { getDemoMode, setDemoMode };
