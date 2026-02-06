const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { roomSchema } = require('../utils/schemas/roomSchemas');

// All routes require authentication
router.use(authenticateToken);

router.get('/', roomController.getAll);
router.get('/available-tenants', isAdmin, roomController.getAvailableTenants);
router.get('/:id', roomController.getOne);
router.post('/', isAdmin, roomController.create);
router.put('/:id', isAdmin, roomController.update);
router.delete('/:id', isAdmin, roomController.delete);
router.post('/:id/assign', isAdmin, roomController.assignTenant);
router.post('/:id/remove-tenant', isAdmin, roomController.removeTenant);

module.exports = router;
