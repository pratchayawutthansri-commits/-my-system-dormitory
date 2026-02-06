const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(isAdmin);

router.get('/monthly', reportController.monthlyReport);
router.get('/income-summary', reportController.incomeSummary);

module.exports = router;
