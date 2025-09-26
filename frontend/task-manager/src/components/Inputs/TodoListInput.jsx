import React, { useState } from "react";
import { HiPlus, HiOutlineTrash, HiPencil } from "react-icons/hi";
import Modal from "../Modal";

const TodoListInput = ({ todoList, setTodoList }) => {
  const [option, setOption] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editOption, setEditOption] = useState("");

  const handleAddOption = () => {
    if (option.trim()) {
      setTodoList([...todoList, option.trim()]);
      setOption("");
    }
  };

  const openDeleteModal = (index) => {
    setDeleteIndex(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedArr = todoList.filter((_, idx) => idx !== deleteIndex);
      setTodoList(updatedArr);
      setDeleteIndex(null);
      setIsDeleteModalOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
    setIsDeleteModalOpen(false);
  };

  const startEdit = (index) => {
    setEditIndex(index);
    setEditOption(todoList[index]);
  };

  const saveEdit = () => {
    if (editOption.trim() && editIndex !== null) {
      const updatedArr = [...todoList];
      updatedArr[editIndex] = editOption.trim();
      setTodoList(updatedArr);
      setEditIndex(null);
      setEditOption("");
    }
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditOption("");
  };

  return (
    <div>
      {todoList.map((item, index) => (
        <div
          key={item}
          className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2"
        >
          {editIndex === index ? (
            <>
              <input
                type="text"
                value={editOption}
                onChange={(e) => setEditOption(e.target.value)}
                className="w-full text-[13px] text-black outline-none bg-white border border-gray-300 px-3 py-1 rounded-md"
              />
              <div className="flex gap-2 ml-2">
                <button
                  className="text-green-600 hover:text-green-800"
                  onClick={saveEdit}
                >
                  Save
                </button>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-black flex-1">
                <span className="text-xs text-gray-400 font-semibold mr-2">
                  {index < 9 ? `0${index + 1}` : index + 1}
                </span>
                {item}
              </p>
              <div className="flex gap-3">
                <button
                  className="cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={() => startEdit(index)}
                  aria-label="Edit task"
                >
                  <HiPencil className="text-lg" />
                </button>
                <button
                  className="cursor-pointer text-red-500 hover:text-red-700"
                  onClick={() => openDeleteModal(index)}
                  aria-label="Delete task"
                >
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <div className="flex items-center gap-5 mt-4">
        <input
          type="text"
          placeholder="Enter Task"
          value={option}
          onChange={({ target }) => setOption(target.value)}
          className="w-full text-[13px] text-black outline-none bg-white border border-gray-100 px-3 py-2 rounded-md"
        />

        <button className="card-btn text-nowrap" onClick={handleAddOption}>
          <HiPlus className="text-lg" /> Add
        </button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="Confirm Delete"
      >
        <p>Are you sure you want to delete this task?</p>
        <div className="flex justify-end gap-4 mt-4">
          <button
            className="btn-primary bg-gray-300 text-black hover:bg-gray-400"
            onClick={cancelDelete}
          >
            Cancel
          </button>
          <button
            className="btn-primary bg-red-500 hover:bg-red-600"
            onClick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TodoListInput;
