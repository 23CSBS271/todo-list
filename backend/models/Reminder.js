const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    type: { type: String, enum: ['assigned', 'due_soon', 'overdue'], required: true },
    message: { type: String, required: true },
    dueAt: { type: Date },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReminderSchema.index({ user: 1, task: 1, type: 1 }, { unique: false });

module.exports = mongoose.model('Reminder', ReminderSchema);


