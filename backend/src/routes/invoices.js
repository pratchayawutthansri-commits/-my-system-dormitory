const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');
const upload = require('../middleware/upload');

router.use(authenticateToken);

router.get('/', invoiceController.getAll);
router.get('/:id', invoiceController.getOne);
router.put('/:id', isAdmin, invoiceController.update);
router.put('/:id/pay', isAdmin, invoiceController.markPaid);
router.put('/:id/slip', invoiceController.uploadSlip);
router.get('/:id/pdf', invoiceController.downloadInvoicePDF);
router.delete('/:id', isAdmin, invoiceController.delete);

module.exports = router;

