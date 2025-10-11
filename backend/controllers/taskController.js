const Task = require("../models/Task");
const User = require("../models/User");
const Board = require("../models/Board");
const Reminder = require("../models/Reminder");
const ActivityLog = require("../models/ActivityLog");
const { sendEmail } = require("../utils/emailService");
const Joi = require('joi');

// Joi schemas
const createTaskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').required(),
  dueDate: Joi.date().required(),
  category: Joi.string().optional(),
  assignedTo: Joi.array().items(Joi.string()).required(),
  attachments: Joi.array().optional(),
  todoChecklist: Joi.array().optional(),
  boardId: Joi.string().required(),
  tags: Joi.array().optional(),
  reminderDate: Joi.date().optional()
});

const updateTaskSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional(),
  category: Joi.string().optional(),
  assignedTo: Joi.array().items(Joi.string()).optional(),
  attachments: Joi.array().optional(),
  todoChecklist: Joi.array().optional(),
  boardId: Joi.string().optional(),
  tags: Joi.array().optional(),
  reminderDate: Joi.date().optional(),
  column: Joi.string().optional()
});

//@desc   Get dashboard data for admin
//@route  GET /api/tasks/dashboard-data
//@access Private/Admin
const getDashboardData = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: 'pending' });
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const overdueTasks =await Task.countDocuments({
            status: { $ne: 'Completed' },
            dueDate: { $lt: new Date() }
        });

       const taskStatues = ['pending', 'In Progress', 'Completed'];
       const taskDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]); 
        const taskDistribution = taskStatues.reduce((acc, status) => {
            const formattedStatus = status.replace(/\s+/g, "");
            acc[formattedStatus] = 
            taskDistributionRaw.find(item => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"]= totalTasks;

        const taskPriorities = ['low', 'medium', 'high'];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {
                $group: {  
                    _id: '$priority',
                    count: { $sum: 1 }
                },
            },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = 
            taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find()
            .sort({ createdAt: -1 })
            .limit( 10)
            .select('title status priority dueDate createdAt')

            res.status(200).json({
                statistics: {
                    totalTasks,
                    pendingTasks,
                    completedTasks,
                    overdueTasks,
                },
                charts: {
                    taskDistribution,
                    taskPriorityLevels,
                },
                recentTasks,
            });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Get dashboard data for regular users
//@route  GET /api/tasks/user-dashboard-data
//@access Private
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;

        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: 'pending' });
        const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'Completed' });
        const overdueTasks = await Task.countDocuments({ 
            assignedTo: userId, 
            status: { $ne: 'Completed' },
            dueDate: { $lt: new Date() }
        });

        const taskStatues = ['pending', 'In Progress', 'Completed'];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }      
            } }
        ]);

        const taskDistribution = taskStatues.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = 
            taskDistributionRaw.find(item => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"]= totalTasks;

        const taskPriorities = ['low', 'medium', 'high'];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = 
            taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find({ assignedTo: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title status priority dueDate createdAt');

        res.status(200).json({
                statistics: {
                    totalTasks,
                    pendingTasks,
                    completedTasks,
                    overdueTasks,
                },
                charts: {
                    taskDistribution,
                    taskPriorityLevels,
                },
                recentTasks,
            });    
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Get all tasks (Admin: all, user: only assigned tasks)
//@route  GET /api/tasks
//@access Private
const getTasks = async (req, res) => {
    try {
        const { status, category, dateRange, page = 1, limit = 10, search, boardId } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (search) filter.$text = { $search: search };
        if (boardId) {
            filter.boardId = boardId;
            // Check access to board
            const board = await Board.findById(boardId);
            if (!board || (board.owner.toString() !== req.user._id.toString() && !board.members.includes(req.user._id))) {
                return res.status(403).json({ message: 'Access denied to board' });
            }
        }

        if (dateRange) {
            const now = new Date();
            let start;
            if (dateRange === 'today') {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (dateRange === 'yesterday') {
                const y = new Date(now);
                y.setDate(y.getDate() - 1);
                const startY = new Date(y.getFullYear(), y.getMonth(), y.getDate());
                filter.createdAt = { $gte: startY, $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
            } else if (dateRange === 'weekly') {
                start = new Date(now);
                start.setDate(start.getDate() - 7);
            } else if (dateRange === 'monthly') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (dateRange === 'yearly') {
                start = new Date(now.getFullYear(), 0, 1);
            }
            if (!filter.createdAt && start) filter.createdAt = { $gte: start, $lte: now };
        }

        let tasksQuery;
        if (req.user.role === 'admin') {
            tasksQuery = Task.find(filter);
        } else {
            tasksQuery = Task.find({ ...filter, assignedTo: req.user._id });
        }

        const tasks = await tasksQuery
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('assignedTo', 'name email profileImageUrl');

        const tasksWithCounts = await Promise.all(tasks.map(async (task) => {
            const completedCount = task.todoChecklist.filter(item => item.completed).length;
            return { ...task._doc, completedTodoCount: completedCount };
        }));

        const countFilter = req.user.role === 'admin' ? filter : { ...filter, assignedTo: req.user._id };
        const allTasks = await Task.countDocuments(countFilter);

        const pendingTasks = await Task.countDocuments({ ...countFilter, status: 'pending' });
        const inProgressTasks = await Task.countDocuments({ ...countFilter, status: 'In Progress' });
        const completedTasks = await Task.countDocuments({ ...countFilter, status: 'Completed' });

        res.json({
            tasks: tasksWithCounts,
            statusSummary: { all: allTasks, pendingTasks, inProgressTasks, completedTasks },
            pagination: { page: Number(page), limit: Number(limit), total: allTasks, pages: Math.ceil(allTasks / Number(limit)) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ...existing code continues...


//@desc   Get task by ID
//@route  GET /api/tasks/:id
//@access Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email profileImageUrl');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check board access
        const board = await Board.findById(task.boardId);
        if (!board || (board.owner.toString() !== req.user._id.toString() && !board.members.includes(req.user._id))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if user can access this task (admin or assigned user)
        if (req.user.role !== 'admin' && !task.assignedTo.some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied. You can only view your assigned tasks.' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Create new task
//@route  POST /api/tasks
//@access Private/Admin
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, category, assignedTo, attachments, todoChecklist, boardId, tags, reminderDate } = req.body;

        // Validate input
        const { error } = createTaskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check board access
        const board = await Board.findById(boardId);
        if (!board || (board.owner.toString() !== req.user._id.toString() && !board.members.includes(req.user._id))) {
            return res.status(403).json({ message: 'Access denied to board' });
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            category,
            assignedTo,
            createdBy: req.user._id,
            attachments,
            todoChecklist,
            boardId,
            tags: tags || [],
            reminderDate,
        });

        // Create assignment reminders for each assignee
        if (Array.isArray(assignedTo) && assignedTo.length > 0) {
            const reminderDocs = assignedTo.map((userId) => ({
                user: userId,
                task: task._id,
                type: 'assigned',
                message: `You have been assigned to task: ${title}`,
                dueAt: new Date(dueDate),
            }));
            await Reminder.insertMany(reminderDocs).catch(() => {});

            // Send email reminders for assigned tasks
            for (const userId of assignedTo) {
                const user = await User.findById(userId);
                if (user && user.email) {
                    const subject = 'New Task Assigned';
                    const text = `Hello ${user.name},\n\nYou have been assigned a new task: "${title}".\nDue date: ${new Date(dueDate).toLocaleString()}\n\nPlease check your task dashboard for details.`;
                    await sendEmail(user.email, subject, text);
                }
            }
        }

        // Create notifications for assigned users
        for (const u of task.assignedTo) {
            await Notification.create({
                user: u,
                type: 'assignment',
                message: `You have been assigned to task "${task.title}"`,
                relatedTask: task._id,
                relatedBoard: task.boardId
            });
        }

        // Log activity
        await ActivityLog.create({
            action: 'task_created',
            user: req.user._id,
            boardId: task.boardId,
            taskId: task._id,
            details: { title: task.title }
        });

        res.status(201).json({message :"Task created successfully", task});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Update task
//@route  PUT /api/tasks/:id
//@access Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user can update this task (admin or assigned user)
        if (req.user.role !== 'admin' && !task.assignedTo.some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied. You can only update your assigned tasks.' });
        }

        // Validate input
        const { error } = updateTaskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check board access if changing board
        if (req.body.boardId && req.body.boardId !== task.boardId.toString()) {
            const newBoard = await Board.findById(req.body.boardId);
            if (!newBoard || (newBoard.owner.toString() !== req.user._id.toString() && !newBoard.members.includes(req.user._id))) {
                return res.status(403).json({ message: 'Access denied to new board' });
            }
        }

        // Update fields
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;
        task.boardId = req.body.boardId || task.boardId;
        task.tags = req.body.tags || task.tags;
        task.reminderDate = req.body.reminderDate || task.reminderDate;
        task.column = req.body.column || task.column;

        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res
                    .status(400)
                    .json({ message: "assignedTo must be an array of user ID's" });
            }
            task.assignedTo = req.body.assignedTo;
        }

        const updatedTask = await task.save();
        res.json({ message: 'Task updated successfully', updatedTask });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Delete task
//@route  DELETE /api/tasks/:id
//@access Private/Admin
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
         
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Update task status
//@route  PUT /api/tasks/:id/status
//@access Private
const updateTaskStatus = async (req, res) => {
    try {
        
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
         
        const isAssigned = task.assignedTo.some(
        (userId) => userId.toString() === req.user._id.toString()
);

        if (!isAssigned && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        task.status = req.body.status || task.status;
        if (task.status === 'Completed') {
            task.todoChecklist.forEach((item) => (item.completed = true));
            task.progress = 100;
        } 

        await task.save();
        res.json({ message: 'Task status updated successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Update task checklist
//@route  PUT /api/tasks/:id/todo
//@access Private
const updateTaskChecklist = async (req, res) => {
    try {
        const { todoChecklist } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!task.assignedTo.includes(req.user._id) && req.user.role !== 'admin') {
            return res
                .status(403)
                .json({ message:'Not authorized to update checklist' });
        }


        task.todoChecklist = todoChecklist;

        const completedCount = task.todoChecklist.filter(item => item.completed).length;
        const totalItems = task.todoChecklist.length;
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) :0;

        if(task.progress === 100){
            task.status = 'Completed';
        }else if(task.progress > 0){
            task.status = 'In Progress';
        }else{
            task.status = 'pending';
        }
        await task.save();
        const updatedTask = await Task.findById(req.params.id).populate('assignedTo', 'name email profileImageUrl');

        res.json({message: 'task Checklist updated successfully', task: updatedTask })  ;
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Move task to different column (Kanban)
//@route  PUT /api/tasks/:id/move
//@access Private
const moveTask = async (req, res) => {
    try {
        const { newColumn } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check board access
        const board = await Board.findById(task.boardId);
        if (!board || (board.owner.toString() !== req.user._id.toString() && !board.members.includes(req.user._id))) {
            return res.status(403).json({ message: 'Access denied to board' });
        }

        const oldColumn = task.column;
        task.column = newColumn;
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'task_moved',
            user: req.user._id,
            boardId: task.boardId,
            taskId: task._id,
            details: { fromColumn: oldColumn, toColumn: newColumn }
        });

        // Create notifications for assigned users
        for (const u of task.assignedTo) {
            await Notification.create({
                user: u,
                type: 'update',
                message: `Task "${task.title}" moved to ${newColumn}`,
                relatedTask: task._id,
                relatedBoard: task.boardId
            });
        }

        res.json({ message: 'Task moved successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getDashboardData,
    getUserDashboardData,
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    moveTask
};
