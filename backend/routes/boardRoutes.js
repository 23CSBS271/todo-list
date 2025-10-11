const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
} = require('../controllers/boardController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// Board CRUD
router.route('/')
  .post(createBoard)
  .get(getBoards);

router.route('/:id')
  .get(getBoardById)
  .put(updateBoard)
  .delete(deleteBoard);

// Member management
router.put('/:id/add-member', addMember);
router.put('/:id/remove-member', removeMember);

module.exports = router;
