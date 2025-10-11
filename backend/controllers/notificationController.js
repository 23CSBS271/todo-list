const Notification = require('../models/Notification');

//@desc   Get notifications for user
//@route  GET /api/notifications
//@access Private
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('relatedTask', 'title')
            .populate('relatedBoard', 'name');

        const total = await Notification.countDocuments({ user: req.user._id });
        res.json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Mark notification as read
//@route  PUT /api/notifications/:id/read
//@access Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//@desc   Get unread count
//@route  GET /api/notifications/unread-count
//@access Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    getUnreadCount
};
