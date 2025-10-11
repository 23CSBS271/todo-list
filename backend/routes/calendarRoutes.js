const express = require('express');
const { protect } = require("../middlewares/authMiddleware");
const { getCalendarEvents } = require("../controllers/calendarController");

const router = express.Router();

// Calendar routes
router.get("/events", protect, getCalendarEvents);

module.exports = router;
