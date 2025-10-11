const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    try {
        const User = require('../models/User');
        let token = req.headers.authorization;

        if (token && token.startsWith('Bearer')) {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } else {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Token failed', error: error.message });
    }
};

const adminOnly = (req, res, next) => {
    if(req.user && req.user.role === "admin"){
        next();
    }else{
        res.status(403).json({ message: "Access denied. Admin only"});
    }
};

// Board permissions middleware
const checkBoardAccess = async (req, res, next) => {
    try {
        const boardId = req.params.id || req.body.boardId || req.query.boardId;
        if (!boardId) {
            return res.status(400).json({ message: 'Board ID is required' });
        }

        const Board = require('../models/Board');
        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is owner or member
        if (board.owner.toString() !== req.user._id.toString() && 
            !board.members.some(memberId => memberId.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied to board' });
        }

        req.board = board;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { protect, adminOnly, checkBoardAccess };
