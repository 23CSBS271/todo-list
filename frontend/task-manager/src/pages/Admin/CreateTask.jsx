import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PRIORITY_DATA, STATUS_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import { LuTrash2 } from "react-icons/lu";
import SelectDropdown from "../../components/Inputs/SelectDropDown";
import SelectUsers from "../../components/Inputs/SelectUsers"; 
import AddAttachmentsInput from "../../components/Inputs/AddAttachmentsinput"; // Added import for AddAttachmentsInput
import TodoListInput from "../../components/Inputs/TodoListInput"; // Added import for TodoListInput
import Modal from "../../components/Modal";

// Mock user data (later can come from API)
const USERS_DATA = [
  { value: "1", label: "Alice" },
  { value: "2", label: "Bob" },
  { value: "3", label: "Charlie" },
];

const CreateTask = () => {
  const location = useLocation();
  const taskID = location.state?.taskId || null;
  const navigate = useNavigate();

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "Low",
    status: "pending",
    dueDate: null,
    assignedTo: [],
    todoChecklist: [],
    attachments: [],
  });

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "Low",
      status: "pending",
      dueDate: null,
      assignedTo: [],
      todoChecklist: [],
      attachments: [],
    });
  };

  // === API CRUD ===
  const createTask = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.TASKS.CREATE_TASK,
        {
          ...taskData,
          priority: taskData.priority.toLowerCase(),
          status: taskData.status,
          dueDate: new Date(taskData.dueDate).toISOString(),
          todoChecklist: taskData.todoChecklist.map(text => ({ text, completed: false })),
        }
      );

      toast.success("Task Created Successfully");

      clearData();
    } catch (error) {
      console.error("Error creating task:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async () => {
    setLoading(true);

    try{
      const todolist = taskData.todoChecklist?.map((item) =>{
        const prevTodoChecklist= currentTask?.todoChecklist || [];
        const matchedTask = prevTodoChecklist.find((task) => task.text == item);

        return{
          text:item,
          completed: matchedTask ? matchedTask.completed : false
        };
    });
    const response = await axiosInstance.put(
      API_PATHS.TASKS.UPDATE_TASK(taskID),
      {
        ...taskData,
        priority: taskData.priority.toLowerCase(),
        status: taskData.status,
        dueDate:new Date(taskData.dueDate).toISOString(),
        todoChecklist: todolist
      }
    );
    toast.success("Task Updated Successfully");
  }catch (error){
    console.error("Error creating task:",error);
    setLoading(false);
  }finally{
    setLoading(false);
  }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!taskData.title.trim()){
      setError("Title is required.");
      return;
    }
    if(!taskData.description.trim()){
       setError("Description is required.");
       return;
    }
    if(!taskData.dueDate){
      setError("Due date  is required.");
      return;
    }

    if(taskData.assignedTo?.length === 0){
      setError("Task not assigned to any member");
      return;
    }

    if(taskData.todoChecklist?.length === 0){
      setError("Add atleast one todo task");
      return;
    }
     
    if(taskID){
      updateTask();
      return;
    }

    createTask();

  };

  const getTaskDetailsByID = async () => {
    try{
      const response =await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(taskID)
      );

      if(response.data){
        const taskInfo = response.data;
        setCurrentTask(taskInfo);

        setTaskData((prevState) => ({
          title : taskInfo.title,
          description: taskInfo.description,
          priority: taskInfo.priority,
          status: taskInfo.status,
          dueDate:taskInfo.dueDate
          ? moment(taskInfo.dueDate).format("YYYY-MM-DD")
          : null,
          assignedTo: taskInfo?.assignedTo?.map((item) => item?._id) || [],
          todoChecklist:
           taskInfo?.todoChecklist?.map((item) => item?.text) || [],
           attachments: taskInfo?.attachments || [],
        }));
      }
    }catch(error){
      console.error("Error fetching users:",error);
    }
  };
  const deleteTask = async () => {
    try{
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskID));

      setOpenDeleteAlert(false);
      toast.success("Task deleted successfully");
      navigate('/admin/tasks')
    }catch(error){
      console.error(
        "error deleting task:",error.response?.data?.message || error.message
      );
    }
  };

  useEffect(() =>{
    if(taskID){
      getTaskDetailsByID(taskID)
    }
    return () => {

    }
  }, [taskID] );

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="mt-5"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
        <div className="col-span-4 flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">
            {taskID ? "Update Task" : "Create Task"}
          </h2>

          {taskID && (
            <button
              className="text-red-500 hover:text-red-600"
              onClick={() => setOpenDeleteAlert(true)}
            >
              <LuTrash2 className="inline mr-1" /> Delete
            </button>
          )}
        </div>

        <div className="col-span-3">
          {/* Task Title */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600">
              Task Title
            </label>
            <input
              placeholder="Create App UI"
              className="form-input w-full mt-1"
              value={taskData.title}
              onChange={({ target }) => handleValueChange("title", target.value)}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              placeholder="Describe task"
              className="form-input w-full mt-1"
              rows={4}
              value={taskData.description}
              onChange={({ target }) =>
                handleValueChange("description", target.value)
              }
            />
          </div>

          {/* Priority + Due Date + Status */}
          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-6 md:col-span-4">
              <label className="text-xs font-medium text-slate-600">
                Priority
              </label>
              <SelectDropdown
                options={PRIORITY_DATA}
                value={taskData.priority}
                onChange={(value) => handleValueChange("priority", value)}
                placeholder="Select Priority"
              />
            </div>

            <div className="col-span-6 md:col-span-4">
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>
              <SelectDropdown
                options={STATUS_DATA}
                value={taskData.status}
                onChange={(value) => handleValueChange("status", value)}
                placeholder="Select Status"
              />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className="text-xs font-medium text-slate-600">
                Due Date
              </label>
              <input
                type="date"
                className="form-input w-full mt-1"
                value={taskData.dueDate || ""}
                onChange={({ target }) =>
                  handleValueChange("dueDate", target.value)
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                TODO Checklist
              </label>
              <TodoListInput
                todoList={taskData?.todoChecklist}
                setTodoList={(value) =>
                  handleValueChange("todoChecklist", value)
                }
              />
            </div>

            {/* Assign To */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Assign To
              </label>
              <SelectUsers
                selectedUsers={taskData.assignedTo}
                setSelectedUsers={(value) =>
                  handleValueChange("assignedTo", value)
                }
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs font-medium text-slate-600">
              Add Attachments
            </label>

            <AddAttachmentsInput
              attachments={taskData?.attachments}
              setAttachments={(value) =>
                handleValueChange("attachments", value)
              }
            />
          </div>
          {error &&(
            <p className="text-xs font-medium text-red-500 mt-5">{error}</p>
          )}

          <div className="flex justify-end mt-7">
            <button
            className="add-btn"
            onClick={handleSubmit}
            disabled={loading}
            >
              {taskID ? "UPDATE TASK ": "CREATE TASK"}
            </button>
          </div>
        </div>
      </div>

      <Modal
      isOpen={openDeleteAlert}
      onClose={() => setOpenDeleteAlert(false)}
      title="Delete Task"
      >
        <div className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete this task?
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-light" onClick={() => setOpenDeleteAlert(false)}>
            Cancel
          </button>
          <button className="btn-danger" onClick={deleteTask}>
            Delete
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default CreateTask;
