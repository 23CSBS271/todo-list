import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import KanbanBoard from '../components/KanbanBoard';

const Board = () => {
  return (
    <DashboardLayout activeMenu="boards">
      <KanbanBoard />
    </DashboardLayout>
  );
};

export default Board;
