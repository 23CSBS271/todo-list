import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import useRealtime from '../hooks/useRealtime';

const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const KanbanBoard = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(['To Do', 'In Progress', 'Done']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBoard = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.BOARDS.GET_BOARD_BY_ID(boardId));
      setBoard(response.data.board);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching board', error);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  // Listen to realtime updates
  useRealtime('task_moved', (data) => {
    if (data.boardId === boardId) {
      fetchBoard(); // Refetch on move
    }
  });

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task
    const task = tasks.find(t => t._id === activeId);
    if (!task) return;

    // Determine new column
    let newColumn = task.column;
    if (columns.includes(overId)) {
      newColumn = overId;
    } else {
      // Dropped on another task, find its column
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) {
        newColumn = overTask.column;
      }
    }

    if (newColumn !== task.column) {
      try {
        await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK_STATUS(activeId), { status: newColumn });
        // Update local state
        setTasks(prev => prev.map(t => t._id === activeId ? { ...t, column: newColumn } : t));
      } catch (error) {
        console.error('Error moving task', error);
      }
    }
  };

  const getTasksByColumn = (column) => {
    return tasks.filter(task => task.column === column);
  };

  if (!board) {
    return <div>Loading board...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{board.name}</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto">
          {columns.map((column) => (
            <div key={column} className="flex-1 min-w-64">
              <h3 className="text-lg font-semibold mb-2">{column}</h3>
              <SortableContext items={getTasksByColumn(column).map(t => t._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getTasksByColumn(column).map((task) => (
                    <SortableItem key={task._id} id={task._id}>
                      <div className="card p-3 cursor-pointer">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          Assigned to: {task.assignedTo.map(u => u.name).join(', ')}
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
