const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getMine = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { demande: { select: { id: true, numero: true } } },
  });
  res.json(notifications);
};

const markRead = async (req, res) => {
  const { id } = req.params;
  await prisma.notification.update({ where: { id: parseInt(id) }, data: { read: true } });
  res.json({ message: 'Notification marquée comme lue' });
};

const markAllRead = async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
  res.json({ message: 'Toutes les notifications marquées comme lues' });
};

const getUnreadCount = async (req, res) => {
  const count = await prisma.notification.count({ where: { userId: req.user.id, read: false } });
  res.json({ count });
};

module.exports = { getMine, markRead, markAllRead, getUnreadCount };
