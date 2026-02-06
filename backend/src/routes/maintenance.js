const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const maintenanceController = require('../controllers/maintenanceController');
const upload = require('../middleware/upload');
const { isAdmin } = require('../middleware/roleCheck');

// ทุก route ต้อง login ก่อน
router.use(authenticateToken);

// Routes สำหรับทั้ง Admin และ Tenant
router.get('/', maintenanceController.getMaintenanceRequests);

// Route สำหรับ Tenant สร้างแจ้งซ่อม
router.post('/', maintenanceController.createMaintenance);

// Routes สำหรับ Admin เท่านั้น (ต้องอยู่ก่อน /:id)
router.get('/admin/stats', isAdmin, maintenanceController.getMaintenanceStats);

// Routes ที่มี parameter /:id ต้องอยู่หลัง static routes
router.get('/:id', maintenanceController.getMaintenanceById);
router.put('/:id/status', isAdmin, maintenanceController.updateMaintenanceStatus);
router.delete('/:id', isAdmin, maintenanceController.deleteMaintenance);

module.exports = router;
