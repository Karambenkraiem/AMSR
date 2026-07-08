const { Router } = require('express');
const { getAll, create, revoke } = require('../controllers/delegations.controller');
const { authenticate, denyReadOnly } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.post('/', denyReadOnly, create);
router.patch('/:id/revoquer', denyReadOnly, revoke);
module.exports = router;
