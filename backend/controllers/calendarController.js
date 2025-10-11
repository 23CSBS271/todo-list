const Task = require("../models/Task");
const Reminder = require("../models/Reminder");
const Board = require("../models/Board");

//@desc   Get calendar events (tasks and reminders) within date range
//@route  GET /api/calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD
//@access Private
const getCalendarEvents = async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ message: 'Start and end dates are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        let taskFilter = {
            $or: [
                { dueDate: { $gte: startDate, $lte: endDate } },
                { reminderDate: { $gte: startDate, $lte: endDate } }
            ]
        };

        let reminderFilter = {
            dueAt: { $gte: startDate, $lte: endDate }
        };

        // For non-admin, filter by assigned tasks and accessible boards
        if (req.user.role !== 'admin') {
            // Get boards user has access to
            const accessibleBoards = await Board.find({
                $or: [
                    { owner: req.user._id },
                    { members: req.user._id }
                ]
            }).select('_id');

            const boardIds = accessibleBoards.map(b => b._id);

            taskFilter.boardId = { $in: boardIds };
            taskFilter.assignedTo = req.user._id;

            reminderFilter.user = req.user._id;
        }

        // Fetch tasks
        const tasks = await Task.find(taskFilter)
            .populate('assignedTo', 'name')
            .populate('boardId', 'name')
            .select('title dueDate reminderDate status priority boardId assignedTo');

        // Fetch reminders
        const reminders = await Reminder.find(reminderFilter)
            .populate('user', 'name')
            .populate('task', 'title')
            .select('message dueAt type task user');

        // Format as calendar events
        const events = [];

        tasks.forEach(task => {
            // Event for due date
            if (task.dueDate) {
                events.push({
                    id: `task-due-${task._id}`,
                    title: `${task.title} (Due)`,
                    start: task.dueDate,
                    end: task.dueDate,
                    allDay: true,
                    resource: {
                        type: 'task',
                        id: task._id,
                        status: task.status,
                        priority: task.priority,
                        board: task.boardId?.name,
                        assignedTo: task.assignedTo.map(u => u.name).join(', ')
                    }
                });
            }

            // Event for reminder date
            if (task.reminderDate) {
                events.push({
                    id: `task-reminder-${task._id}`,
                    title: `${task.title} (Reminder)`,
                    start: task.reminderDate,
                    end: task.reminderDate,
                    allDay: true,
                    resource: {
                        type: 'task-reminder',
                        id: task._id,
                        status: task.status,
                        priority: task.priority,
                        board: task.boardId?.name,
                        assignedTo: task.assignedTo.map(u => u.name).join(', ')
                    }
                });
            }
        });

        reminders.forEach(reminder => {
            events.push({
                id: `reminder-${reminder._id}`,
                title: reminder.message,
                start: reminder.dueAt,
                end: reminder.dueAt,
                allDay: true,
                resource: {
                    type: 'reminder',
                    id: reminder._id,
                    reminderType: reminder.type,
                    task: reminder.task?.title,
                    user: reminder.user?.name
                }
            });
        });

        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getCalendarEvents
};
