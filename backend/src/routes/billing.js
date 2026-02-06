const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(isAdmin);

router.post('/meter-reading', billingController.recordMeter);
router.post('/generate', billingController.generateInvoice);
router.post('/generate-all', billingController.generateAllInvoices);
router.get('/meter-readings/:roomId', billingController.getMeterReadings);

module.exports = router;
