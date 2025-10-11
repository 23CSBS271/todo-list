const Board = require('../models/Board');
const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

// @desc Create a new board
// @route POST /api/boards
// @access Private
const createBoard = async (req, res) => {
  try {
    const { name, description, members, isPublic, color } = req.body;
    const owner = req.user._id;

    // Validate members are users
    if (members && !Array.isArray(members)) {
      return res.status(400).json({ message: 'Members must be an array of user IDs' });
    }

    const board = await Board.create({
      name,
      description,
      owner,
      members: members || [],
      isPublic: isPublic || false,
      color: color || '#007bff'
    });

    // Add board to owner's boards array
    await User.findByIdAndUpdate(owner, { $addToSet: { boards: board._id } });

    // Add to members' boards if provided
    if (members && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { $addToSet: { boards: board._id } }
      );

      // Send notifications to members
      for (const memberId of members) {
        await Notification.create({
          user: memberId,
          type: 'assignment',
          message: `You have been added to board: ${name}`,
          relatedBoard: board._id
        });

        // Email notification
        const member = await User.findById(memberId).select('name email');
        if (member && member.email) {
          const subject = 'Added to New Board';
          const text = `Hello ${member.name},\n\nYou have been added to the board "${name}".\n\nPlease check your dashboard for details.`;
          await sendEmail(member.email, subject, text);
        }
      }
    }

    // Log activity
    await ActivityLog.create({
      action: 'board_created',
      user: owner,
      boardId: board._id,
      details: { name }
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(201).json({ message: 'Board created successfully', board: populatedBoard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get all boards for user (owned or member)
// @route GET /api/boards
// @access Private
const getBoards = async (req, res) => {
  try {
    const userId = req.user._id;
    const boards = await Board.find({
      $or: [
        { owner: userId },
        { members: userId },
        { isPublic: true }
      ]
    })
      .populate('owner', 'name email profileImageUrl')
      .populate('members', 'name email profileImageUrl')
      .sort({ createdAt: -1 });

    res.json({ boards });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get board by ID
// @route GET /api/boards/:id
// @access Private
const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email profileImageUrl')
      .populate('members', 'name email profileImageUrl');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check access
    const userId = req.user._id;
    const hasAccess = board.owner.toString() === userId.toString() ||
                      board.members.some(m => m._id.toString() === userId.toString()) ||
                      board.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get tasks in this board
    const tasks = await Task.find({ boardId: board._id })
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('createdBy', 'name email profileImageUrl')
      .sort({ createdAt: -1 });

    res.json({ board, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update board
// @route PUT /api/boards/:id
// @access Private (owner only)
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Owner only
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only owner can update' });
    }

    const updates = req.body;
    const updatedBoard = await Board.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members', 'name email');

    // Log activity
    await ActivityLog.create({
      action: 'board_updated',
      user: req.user._id,
      boardId: board._id,
      details: updates
    });

    res.json({ message: 'Board updated successfully', board: updatedBoard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Delete board
// @route DELETE /api/boards/:id
// @access Private (owner only)
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Owner only
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only owner can delete' });
    }

    // Delete associated tasks
    await Task.deleteMany({ boardId: req.params.id });

    // Remove from users' boards
    await User.updateMany(
      { boards: req.params.id },
      { $pull: { boards: req.params.id } }
    );

    await board.deleteOne();

    // Log activity
    await ActivityLog.create({
      action: 'board_deleted',
      user: req.user._id,
      boardId: req.params.id,
      details: { name: board.name }
    });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Add member to board
// @route PUT /api/boards/:id/add-member
// @access Private (owner only)
const addMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Owner only
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user exists
    const user = await User.findById(memberId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add if not already member
    if (!board.members.includes(memberId)) {
      board.members.push(memberId);
      await board.save();

      // Add to user's boards
      await User.findByIdAndUpdate(memberId, { $addToSet: { boards: board._id } });

      // Notification
      await Notification.create({
        user: memberId,
        type: 'assignment',
        message: `You have been added to board: ${board.name}`,
        relatedBoard: board._id
      });

      // Email
      const subject = 'Added to Board';
      const text = `Hello ${user.name},\n\nYou have been added to the board "${board.name}".\n\nPlease check your dashboard.`;
      await sendEmail(user.email, subject, text);

      // Log
      await ActivityLog.create({
        action: 'member_added',
        user: req.user._id,
        boardId: board._id,
        details: { member: memberId }
      });
    }

    const populatedBoard = await Board.findById(board._id).populate('members', 'name email');
    res.json({ message: 'Member added successfully', board: populatedBoard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Remove member from board
// @route PUT /api/boards/:id/remove-member
// @access Private (owner only)
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Owner only (can't remove self unless admin, but for simplicity)
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove if member
    if (board.members.includes(memberId)) {
      board.members.pull(memberId);
      await board.save();

      // Remove from user's boards
      await User.findByIdAndUpdate(memberId, { $pull: { boards: board._id } });

      // Log
      await ActivityLog.create({
        action: 'member_removed',
        user: req.user._id,
        boardId: board._id,
        details: { member: memberId }
      });
    }

    const populatedBoard = await Board.findById(board._id).populate('members', 'name email');
    res.json({ message: 'Member removed successfully', board: populatedBoard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
};
