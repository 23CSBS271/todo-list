const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
});

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        status: { type: String, enum: ['pending', 'In Progress', 'Completed'], default: 'pending' },
        dueDate: { type: Date , required: true },
        category: { type: String, enum: ['Work','Personal','Other'], default: 'Work' },
        assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        attachments: [{ type: String }], 
        todoChecklist: [todoSchema],
        progress: { type: Number, default: 0 }, // percentage of completion
        boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
        column: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
        tags: [{ type: String }],
        reminderDate: { type: Date, required: true, validate: { validator: function(v) { return v < this.dueDate; }, message: 'Reminder date must be before due date' } }
    },
    { timestamps: true }
);

TaskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', TaskSchema);
