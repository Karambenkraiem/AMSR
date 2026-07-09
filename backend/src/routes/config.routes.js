const { Router } = require('express');
const { getDemoMode, setDemoMode } = require('../controllers/config.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.get('/demo-mode', getDemoMode); // public — nécessaire avant connexion (page de login)
router.put('/demo-mode', authenticate, setDemoMode);
module.exports = router;
