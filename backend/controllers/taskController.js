const Task = require("../models/Task");
const User = require("../models/User");

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
        const {status} = req.query;
        let filter = {};
        if (status) {
            filter.status = status;
        }

        let tasks;
        if (req.user.role === 'admin') {
            tasks = await Task.find(filter).populate(
                'assignedTo', 
                'name email profileImageUrl'
            );
        }else {
            tasks = await Task.find({...filter, assignedTo: req.user._id}).populate(
                'assignedTo', 
                'name email profileImageUrl'
            );
        }

        tasks= await Promise.all(tasks.map(async (task) => {
            const completedCount = task.todoChecklist.filter(item => item.completed).length;
            return{ ...task._doc, completedTodoCount: completedCount};
        }));
        const allTasks = await Task.countDocuments(
            req.user.role === 'admin' ? {} : { assignedTo: req.user._id }
        );
        
        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: 'pending',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });
        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: 'In Progress', 
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });
        const completedTasks = await Task.countDocuments({
            ...filter,
            status: 'Completed', 
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });
        res.json({ tasks,
             statusSummary: { all:allTasks, pendingTasks, inProgressTasks, completedTasks } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; // <-- ADD THIS CLOSING BRACE

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
        const { title, description, priority, dueDate, assignedTo, attachments,todoChecklist } = req.body;

        if(!Array.isArray(assignedTo)){
            return res
            .status(400)
            .json({message:" assignedTo must to be an array of user ID's"});
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            attachments,
            todoChecklist,
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

        // Validate input fields
        if (req.body.title && typeof req.body.title !== 'string') {
            return res.status(400).json({ message: 'Title must be a string' });
        }
        if (req.body.dueDate && isNaN(Date.parse(req.body.dueDate))) {
            return res.status(400).json({ message: 'Invalid due date format' });
        }
        if (req.body.priority && !['low', 'medium', 'high'].includes(req.body.priority)) {
            return res.status(400).json({ message: 'Priority must be low, medium, or high' });
        }
        if (req.body.assignedTo && !Array.isArray(req.body.assignedTo)) {
            return res.status(400).json({ message: 'assignedTo must be an array of user IDs' });
        }

        // Update fields
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

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

module.exports = {
    getDashboardData,
    getUserDashboardData,
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist
};
