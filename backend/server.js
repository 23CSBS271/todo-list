require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const { handleMulterError } = require("./middlewares/uploadMiddleware");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const boardRoutes = require("./routes/boardRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const socketHandler = require("./socketHandler");

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

socketHandler(io);

//middleware to handle cors
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connect database
connectDB();

//routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calendar", calendarRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error handling middleware
app.use(handleMulterError);

// Export app for testing
module.exports = app;

//start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Lightweight interval to create due-soon and overdue reminders
// Runs every 5 minutes
try {
    const Reminder = require('./models/Reminder');
    const Task = require('./models/Task');
    const FIVE_MIN = 5 * 60 * 1000;
    const { sendEmail } = require('./utils/emailService');

    setInterval(async () => {
        const now = new Date();
        const soon = new Date(Date.now() + 24 * 60 * 60 * 1000); // next 24h

        // Due soon (within 24h, not completed)
        const dueSoonTasks = await Task.find({ status: { $ne: 'Completed' }, dueDate: { $gte: now, $lte: soon } }).select('_id title dueDate assignedTo boardId');
        for (const t of dueSoonTasks) {
            for (const u of t.assignedTo) {
                await Reminder.findOneAndUpdate(
                    { user: u, task: t._id, type: 'due_soon' },
                    { user: u, task: t._id, type: 'due_soon', message: `Task due soon: ${t.title}`, dueAt: t.dueDate },
                    { upsert: true }
                );

                // Send email for due soon reminder
                const user = await require('./models/User').findById(u);
                if (user && user.email) {
                    const subject = 'Task Due Soon Reminder';
                    const text = `Hello ${user.name},\n\nYour task "${t.title}" is due soon on ${t.dueDate.toLocaleString()}.\nPlease complete it on time.\n\nThank you.`;
                    await sendEmail(user.email, subject, text);
                }

                // Create in-app notification
                await require('./models/Notification').create({
                    user: u,
                    type: 'reminder',
                    message: `Task due soon: ${t.title}`,
                    relatedTask: t._id,
                    relatedBoard: t.boardId
                });
            }
        }

        // Overdue (past due and not completed)
        const overdueTasks = await Task.find({ status: { $ne: 'Completed' }, dueDate: { $lt: now } }).select('_id title dueDate assignedTo boardId');
        for (const t of overdueTasks) {
            for (const u of t.assignedTo) {
                await Reminder.findOneAndUpdate(
                    { user: u, task: t._id, type: 'overdue' },
                    { user: u, task: t._id, type: 'overdue', message: `Task overdue: ${t.title}`, dueAt: t.dueDate },
                    { upsert: true }
                );

                // Send email for overdue reminder
                const user = await require('./models/User').findById(u);
                if (user && user.email) {
                    const subject = 'Overdue Task Reminder';
                    const text = `Hello ${user.name},\n\nYour task "${t.title}" was due on ${t.dueDate.toLocaleString()} and is now overdue.\nPlease take necessary action.\n\nThank you.`;
                    await sendEmail(user.email, subject, text);
                }

                // Create in-app notification
                await require('./models/Notification').create({
                    user: u,
                    type: 'reminder',
                    message: `Task overdue: ${t.title}`,
                    relatedTask: t._id,
                    relatedBoard: t.boardId
                });
            }
        }
    }, FIVE_MIN);
} catch (_) {}
