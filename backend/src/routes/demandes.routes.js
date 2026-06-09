const { Router } = require('express');
const {
  getAll, getOne, create, initAttestation,
  arretTemporaire, reprendreOperations, changementCharge, updateAssistant, adminUpdateStatus,
} = require('../controllers/demandes.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.post('/:id/attestation', initAttestation);
router.post('/:id/arret-temporaire', arretTemporaire);
router.post('/:id/reprendre', reprendreOperations);
router.post('/:id/changement-charge', changementCharge);
router.patch('/:id/assistant', updateAssistant);
router.patch('/:id/status', adminUpdateStatus);
module.exports = router;
