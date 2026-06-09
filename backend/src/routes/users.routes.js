const { Router } = require('express');
const { getAll, getByRole, create, update, remove } = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'chef_centrale', 'chef_maintenance', 'charge_exploitation', 'charge_consignation', 'charge_travaux', 'assistant_charge_exploitation'), getAll);
router.get('/role/:role', getByRole);
router.post('/', authorize('admin'), create);
router.put('/:id', authorize('admin'), update);
router.delete('/:id', authorize('admin'), remove);
module.exports = router;
