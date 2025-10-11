const Reminder = require('../models/Reminder');

// @desc Get my reminders (unread first)
// @route GET /api/reminders
// @access Private
const getMyReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .sort({ read: 1, createdAt: -1 })
      .limit(100)
      .populate('task', 'title dueDate status');
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Mark reminder as read
// @route PUT /api/reminders/:id/read
// @access Private
const markRead = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    reminder.read = true;
    await reminder.save();
    res.json({ message: 'Reminder marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMyReminders, markRead };


