import React, { useState } from "react";
import { HiPlus, HiOutlineTrash, HiMiniPlus } from "react-icons/hi2";
import { HiPencil } from "react-icons/hi";
import { LuPaperclip } from "react-icons/lu";
import Modal from "../Modal";

const AddAttachmentsInput = ({ attachments, setAttachments }) => {
  const [option, setOption] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editOption, setEditOption] = useState("");

  //function to handle adding an option
  const handleAddOption = () => {
    if (option.trim()) {
      setAttachments([...attachments, option.trim()]);
      setOption("");
    }
  };

  //function to handle deleting an option
  const openDeleteModal = (index) => {
    setDeleteIndex(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedArr = attachments.filter((_, idx) => idx !== deleteIndex);
      setAttachments(updatedArr);
      setDeleteIndex(null);
      setIsDeleteModalOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
    setIsDeleteModalOpen(false);
  };

  //function to start editing
  const startEdit = (index) => {
    setEditIndex(index);
    setEditOption(attachments[index]);
  };

  //function to save edit
  const saveEdit = () => {
    if (editOption.trim() && editIndex !== null) {
      const updatedArr = [...attachments];
      updatedArr[editIndex] = editOption.trim();
      setAttachments(updatedArr);
      setEditIndex(null);
      setEditOption("");
    }
  };

  //function to cancel edit
  const cancelEdit = () => {
    setEditIndex(null);
    setEditOption("");
  };

  return (
    <div>
      {attachments.map((item, index) => (
        <div
          key={index}
          className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2"
        >
          {editIndex === index ? (
            <>
              <div className="flex items-center gap-3 flex-1">
                <LuPaperclip className="text-gray-400" />
                <input
                  type="text"
                  value={editOption}
                  onChange={(e) => setEditOption(e.target.value)}
                  className="w-full text-[13px] text-black outline-none bg-white border border-gray-300 px-3 py-1 rounded-md"
                />
              </div>
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
              <div className="flex items-center gap-3 flex-1">
                <LuPaperclip className="text-gray-400" />
                <p className="text-xs text-black">{item}</p>
              </div>
              <div className="flex gap-3">
                <button
                  className="cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={() => startEdit(index)}
                  aria-label="Edit attachment"
                >
                  <HiPencil className="text-lg" />
                </button>
                <button
                  className="cursor-pointer text-red-500 hover:text-red-700"
                  onClick={() => openDeleteModal(index)}
                  aria-label="Delete attachment"
                >
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
<div className="flex items-center gap-5 mt-4">
    <div className="flex-1 flex items-center gap-3 border border-gray-100 rounded-md px-3">
        <LuPaperclip className="text-gray-400"/>

        <input 

    type="text"
    placeholder="Add File Link"
    value={option}
    onChange={({target}) => setOption(target.value)}
    className="w-full text-[13px] text-black outline-none bg-white py-2"
    />
    </div>


    <button className="card-btn txt-nowrap" onClick={handleAddOption}>
        <HiMiniPlus className="text-lg" /> Add
    </button>
</div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="Confirm Delete"
      >
        <p>Are you sure you want to delete this attachment?</p>
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

export default AddAttachmentsInput;
