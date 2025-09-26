import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AvatarGroup from '../../components/layouts/AvatarGroup';
import moment from 'moment';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
// Assuming InfoBox and Attachment components exist; import if needed
// import InfoBox from '../../components/InfoBox';
// import Attachment from '../../components/Attachment';

const ViewTaskDetails = () => {
    const { id } = useParams();
    const [task, setTask] = useState(null);

    const getStatusTagColor = (status) => {
        switch (status) {
            case "In Progress":
                return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
            case "Completed":
                return "text-lime-500 bg-lime-50 border border-lime-500/10";
            default:
                return "text-violet-500 bg-violet-50 border border-violet-500/10";
        }
    };

    const getTaskDetailsByID = async () => {
        try {
            const response = await axiosInstance.get(
                API_PATHS.TASKS.GET_TASK_BY_ID(id)
            );

            if (response.data) {
                const taskInfo = response.data;
                setTask(taskInfo);
            }
        } catch (error) {
            console.error("Error fetching task details", error);
        }
    };

    const updateTodoChecklist = async (index) => {
        // Implement update logic here
        // For now, placeholder
        console.log("Updating todo checklist at index:", index);
    };

    const handleLinkClick = (link) => {
        window.open(link, "_blank");
    };

    useEffect(() => {
        if (id) {
            getTaskDetailsByID();
        }
        return () => {};
    }, [id]);

    const TodoChecklist = ({ text, isChecked, onChange }) => {
        return (
            <div className='flex items-center gap-3 p-3'>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={onChange}
                    className='w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer'
                />
                <p className="text-[13px] text-gray-800">{text}</p>
            </div>
        );
    };

    return (
        <DashboardLayout activeMenu='My Tasks'>
            <div className='mt-5 mb-10'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                    <div className='md:col-span-3'>
                        <div className=''>
                            <h2 className='text-xl md:text-2xl font-medium'>
                                {task?.title}
                            </h2>
                            <div className={`text-[13px] font-medium ${getStatusTagColor(task?.status)} px-4 py-0.5 rounded`}>
                                {task?.status}
                            </div>
                        </div>

                        <div className='mt-4'>
                            {/* Assuming InfoBox component exists */}
                            <div className='text-sm'>
                                <label className='text-xs font-medium text-slate-500 block mb-1'>Description</label>
                                <p>{task?.description}</p>
                            </div>
                        </div>

                        <div className='grid grid-cols-12 gap-4 mt-4'>
                            <div className='col-span-6 md:col-span-4'>
                                {/* Assuming InfoBox component exists */}
                                <div className='text-sm'>
                                    <label className='text-xs font-medium text-slate-500 block mb-1'>Priority</label>
                                    <p>{task?.priority}</p>
                                </div>
                            </div>
                            <div className='col-span-6 md:col-span-4'>
                                {/* Assuming InfoBox component exists */}
                                <div className='text-sm'>
                                    <label className='text-xs font-medium text-slate-500 block mb-1'>Due Date</label>
                                    <p>{task?.dueDate ? moment(task.dueDate).format("Do MMM YYYY") : "N/A"}</p>
                                </div>
                            </div>
                            <div className='col-span-12 md:col-span-4'>
                                <label className='text-xs font-medium text-slate-500 block mb-2'>
                                    Assigned To
                                </label>
                                <AvatarGroup 
                                    avatars={task?.assignedTo?.map((item) => item?.profileImageUrl) || []} 
                                    maxVisible={5}
                                />
                            </div>
                        </div>

                        <div className='mt-4 col-span-12'>
                            <label className='text-xs font-medium text-slate-500 block mb-2'>
                                Todo Checklist
                            </label>
                            {task?.todoChecklist?.map((item, index) => (
                                <TodoChecklist
                                    key={`TODO_${index}`}
                                    text={item.text}
                                    isChecked={item?.completed}
                                    onChange={() => updateTodoChecklist(index)}
                                />
                            ))}
                        </div>

                        {task?.attachments?.length > 0 && (
                            <div className='mt-4 col-span-12'>
                                <label className='text-xs font-medium text-slate-500 block mb-2'>
                                    Attachments
                                </label>
                                {task.attachments.map((link, index) => (
                                    <div key={`link_${index}`} className='flex items-center gap-2 mb-2'>
                                        <LuSquareArrowOutUpRight className='text-blue-500 cursor-pointer' onClick={() => handleLinkClick(link)} />
                                        <a href={link} target='_blank' rel='noopener noreferrer' className='text-blue-500 underline'>{link}</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ViewTaskDetails;
