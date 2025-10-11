const cron = require('node-cron');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Runs every day at 8 AM server time
const scheduleOverdueReminderJob = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('Running overdue reminder job...');
        try {
            const now = new Date();
            // Find overdue tasks not completed
            const overdueTasks = await Task.find({
                status: { $ne: 'Completed' },
                dueDate: { $lt: now }
            });

            for (const task of overdueTasks) {
                for (const userId of task.assignedTo) {
                    // Check if overdue reminder already exists
                    const existingReminder = await Reminder.findOne({
                        user: userId,
                        task: task._id,
                        type: 'overdue'
                    });

                    if (!existingReminder) {
                        // Create overdue reminder
                        const reminder = new Reminder({
                            user: userId,
                            task: task._id,
                            type: 'overdue',
                            message: `Task "${task.title}" is overdue!`,
                            dueAt: task.dueDate,
                        });
                        await reminder.save();

                        // Send email notification
                        const user = await User.findById(userId);
                        if (user && user.email) {
                            const subject = 'Overdue Task Reminder';
                            const text = `Hello ${user.name},\n\nYour task "${task.title}" was due on ${task.dueDate.toLocaleString()} and is now overdue.\nPlease take necessary action.\n\nThank you.`;
                            await sendEmail(user.email, subject, text);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error running overdue reminder job:', error);
        }
    });
};

module.exports = { scheduleOverdueReminderJob };
