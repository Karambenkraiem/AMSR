const { Router } = require('express');
const { login, me, changePassword, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
module.exports = router;
