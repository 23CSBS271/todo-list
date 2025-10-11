import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBoards = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.BOARDS.GET_ALL_BOARDS);
      setBoards(response.data.boards);
    } catch (error) {
      console.error('Error fetching boards', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleViewBoard = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  if (loading) {
    return <div>Loading boards...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => (
        <div key={board._id} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{board.name}</h3>
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: board.color }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{board.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {board.members.length} members
            </span>
            <button
              className="btn-primary text-xs"
              onClick={() => handleViewBoard(board._id)}
            >
              View Board
            </button>
          </div>
        </div>
      ))}
      {boards.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500">No boards found. Create your first board!</p>
        </div>
      )}
    </div>
  );
};

export default BoardList;
