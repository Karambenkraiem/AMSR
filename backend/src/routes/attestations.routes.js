const { Router } = require('express');
const {
  getAll, getOne, accorderExploitation, confirmerRegimeExecute,
  demarrerTravaux, confirmerAssistant, terminerOperation, leverRegime, updateAttestation,
} = require('../controllers/attestations.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', updateAttestation);
router.post('/:id/accord-exploitation', accorderExploitation);
router.post('/:id/regime-execute', confirmerRegimeExecute);
router.post('/:id/demarrer-travaux', demarrerTravaux);
router.post('/:id/confirmer-assistant', confirmerAssistant);
router.post('/:id/terminer-operation', terminerOperation);
router.post('/:id/lever-regime', leverRegime);
module.exports = router;
