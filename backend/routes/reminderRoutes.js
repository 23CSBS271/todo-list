const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getMyReminders, markRead } = require('../controllers/reminderController');

const router = express.Router();

router.get('/', protect, getMyReminders);
router.put('/:id/read', protect, markRead);

module.exports = router;


