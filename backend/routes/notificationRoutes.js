const express = require('express');
const { protect } = require("../middlewares/authMiddleware");
const { getNotifications, markAsRead, getUnreadCount } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.get("/unread-count", protect, getUnreadCount);

module.exports = router;
