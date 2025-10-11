const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true }, // e.g., 'task_created', 'task_moved', 'board_updated'
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        details: { type: Object, default: {} }, // e.g., { fromColumn: 'todo', toColumn: 'done' }
    },
    { timestamps: true }
);

// Indexes for efficient queries
ActivityLogSchema.index({ boardId: 1 });
ActivityLogSchema.index({ user: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
