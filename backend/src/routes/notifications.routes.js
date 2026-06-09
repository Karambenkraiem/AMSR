const { Router } = require('express');
const { getMine, markRead, markAllRead, getUnreadCount } = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getMine);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markRead);
router.put('/mark-all-read', markAllRead);
module.exports = router;
