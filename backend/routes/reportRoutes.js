const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { exportTasks, exportUsersReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/export-tasks",protect,adminOnly, exportTasks);
router.get("/export/users",protect,adminOnly, exportUsersReport);

module.exports = router;