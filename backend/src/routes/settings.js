
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', settingsController.get);
router.put('/', isAdmin, settingsController.update);

module.exports = router;
