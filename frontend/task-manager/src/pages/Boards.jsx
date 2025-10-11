import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import BoardList from '../components/BoardList';

const Boards = () => {
  return (
    <DashboardLayout activeMenu="boards">
      <div className='card my-5'>
        <h2 className='text-xl md:text-2xl'>My Boards</h2>
        <BoardList />
      </div>
    </DashboardLayout>
  );
};

export default Boards;
