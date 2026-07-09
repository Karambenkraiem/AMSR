const { Router } = require('express');
const { getDemoMode, setDemoMode, getQuickAccessUsers } = require('../controllers/config.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.get('/demo-mode', getDemoMode); // public — nécessaire avant connexion (page de login)
router.put('/demo-mode', authenticate, setDemoMode);
router.get('/quick-access-users', getQuickAccessUsers); // public — utilisé par la page de login
module.exports = router;
