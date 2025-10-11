const jwt = require('jsonwebtoken');
const Task = require('./models/Task');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');
const Board = require('./models/Board');

// Socket authentication middleware
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

module.exports = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    // Join user's personal room for notifications
    socket.join(`user_${socket.user.id}`);

    // Join board room (initial join on client side)
    socket.on('joinBoard', async (boardId) => {
      try {
        // Verify user access to board
        const board = await Board.findOne({ _id: boardId, $or: [{ owner: socket.user.id }, { members: socket.user.id }] });
        if (!board) {
          socket.emit('error', { message: 'Access denied to board' });
          return;
        }
        socket.join(`board_${boardId}`);
        socket.emit('joinedBoard', { boardId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Leave board room
    socket.on('leaveBoard', (boardId) => {
      socket.leave(`board_${boardId}`);
    });

    // Task moved event (for Kanban drag-and-drop)
    socket.on('taskMoved', async (data) => {
      const { taskId, newColumn, boardId } = data;
      try {
        // Verify access
        const board = await Board.findOne({ _id: boardId, $or: [{ owner: socket.user.id }, { members: socket.user.id }] });
        if (!board) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Update task column
        const task = await Task.findByIdAndUpdate(
          taskId,
          { column: newColumn },
          { new: true }
        ).populate('assignedTo', 'name email');

        if (!task) {
          socket.emit('error', { message: 'Task not found' });
          return;
        }

        // Log activity
        await ActivityLog.create({
          action: 'task_moved',
          user: socket.user.id,
          boardId,
          taskId,
          details: { fromColumn: task.column, toColumn: newColumn }
        });

        // Create notifications for assignees
        for (const assignee of task.assignedTo) {
          if (assignee._id.toString() !== socket.user.id) {
            await Notification.create({
              user: assignee._id,
              type: 'update',
              message: `Task "${task.title}" was moved to ${newColumn}`,
              relatedTask: taskId,
              relatedBoard: boardId
            });
            // Emit to assignee's room
            io.to(`user_${assignee._id}`).emit('newNotification', {
              type: 'update',
              message: `Task "${task.title}" was moved to ${newColumn}`,
              relatedTask: taskId
            });
          }
        }

        // Emit update to board room (excluding sender if needed)
        io.to(`board_${boardId}`).emit('taskMoved', {
          taskId,
          newColumn,
          task: task
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to move task' });
      }
    });

    // Board updated event
    socket.on('boardUpdated', async (data) => {
      const { boardId, updates } = data;
      try {
        // Verify owner
        const board = await Board.findOneAndUpdate(
          { _id: boardId, owner: socket.user.id },
          updates,
          { new: true }
        );

        if (!board) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Emit to board members
        io.to(`board_${boardId}`).emit('boardUpdated', { boardId, board });
      } catch (err) {
        socket.emit('error', { message: 'Failed to update board' });
      }
    });

    // New task created in board
    socket.on('taskCreated', async (data) => {
      const { task, boardId } = data;
      try {
        // Assuming task is already created in DB via API
        // Emit to board room
        io.to(`board_${boardId}`).emit('taskCreated', { task, boardId });

        // Notify assignees
        for (const assigneeId of task.assignedTo) {
          if (assigneeId.toString() !== socket.user.id) {
            await Notification.create({
              user: assigneeId,
              type: 'assignment',
              message: `You have been assigned to task: ${task.title}`,
              relatedTask: task._id,
              relatedBoard: boardId
            });
            io.to(`user_${assigneeId}`).emit('newNotification', {
              type: 'assignment',
              message: `You have been assigned to task: ${task.title}`,
              relatedTask: task._id
            });
          }
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to notify about new task' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};
