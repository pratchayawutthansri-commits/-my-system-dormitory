const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const announcementController = require('../controllers/announcementController');

router.use(authenticateToken);

// Public routes (for authenticated users like Tenants)
router.get('/active', announcementController.getActiveAnnouncements);

// Admin routes (Protected)
router.get('/', isAdmin, announcementController.getAllAnnouncements);
router.post('/', isAdmin, announcementController.createAnnouncement);
router.put('/:id', isAdmin, announcementController.updateAnnouncement);
router.delete('/:id', isAdmin, announcementController.deleteAnnouncement);

module.exports = router;
