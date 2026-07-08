const { Router } = require('express');
const {
  getAll, getOne, create, initAttestation,
  arretTemporaire, reprendreOperations, changementCharge, updateAssistant, adminUpdateStatus, adminDelete,
} = require('../controllers/demandes.controller');
const { authenticate, denyReadOnly } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', denyReadOnly, create);
router.post('/:id/attestation', denyReadOnly, initAttestation);
router.post('/:id/arret-temporaire', denyReadOnly, arretTemporaire);
router.post('/:id/reprendre', denyReadOnly, reprendreOperations);
router.post('/:id/changement-charge', denyReadOnly, changementCharge);
router.patch('/:id/assistant', denyReadOnly, updateAssistant);
router.patch('/:id/status', denyReadOnly, adminUpdateStatus);
router.delete('/:id', denyReadOnly, adminDelete);
module.exports = router;
