const { Router } = require('express');
const { getAll, create, revoke } = require('../controllers/delegations.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.post('/', create);
router.patch('/:id/revoquer', revoke);
module.exports = router;
