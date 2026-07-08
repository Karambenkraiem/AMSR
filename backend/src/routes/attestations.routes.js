const { Router } = require('express');
const {
  getAll, getOne, accorderExploitation, confirmerRegimeExecute,
  demarrerTravaux, confirmerAssistant, terminerOperation, leverRegime, updateAttestation,
} = require('../controllers/attestations.controller');
const { authenticate, denyReadOnly } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', denyReadOnly, updateAttestation);
router.post('/:id/accord-exploitation', denyReadOnly, accorderExploitation);
router.post('/:id/regime-execute', denyReadOnly, confirmerRegimeExecute);
router.post('/:id/demarrer-travaux', denyReadOnly, demarrerTravaux);
router.post('/:id/confirmer-assistant', denyReadOnly, confirmerAssistant);
router.post('/:id/terminer-operation', denyReadOnly, terminerOperation);
router.post('/:id/lever-regime', denyReadOnly, leverRegime);
module.exports = router;
