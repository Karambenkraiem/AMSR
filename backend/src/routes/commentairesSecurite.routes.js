const { Router } = require('express');
const { getByDemande, getByAttestation, create } = require('../controllers/commentairesSecurite.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/demande/:demandeId', getByDemande);
router.get('/attestation/:attestationId', getByAttestation);
router.post('/', create);
module.exports = router;
