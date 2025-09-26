import React, {useState, useEffect} from 'react'
import { useUserAuth } from '../../hooks/useUserAuth';
import { useContext } from "react";
import { UserContext } from "../../context/userContext";
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {useNavigate} from "react-router-dom";
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';
import {addThousandsSeparator} from "../../utils/helper";
import InfoCard from '../../components/Cards/InfoCard';
import { LuArrowRight } from 'react-icons/lu';
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from '../../components/Charts/CustomBarChart';
import TaskListTable from '../../components/TaskListTable';

const COLORS =["#8D51FF","#00B8DB","#7BCE00"];

const Dashboard = () => {
    useUserAuth();

    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [barChartData, setBarChartData] = useState([
        { priority: "Low", count: 15 },
        { priority: "Medium", count: 10 },
        { priority: "High", count: 8 },
    ]);

    const prepareChartData=(data) => {
        const taskDistribution =data?.taskDistribution||null;
        const taskPriorityLevels=data?.taskPriorityLevels || null;

  const taskDistributionData = [
    { status: "Pending", count: taskDistribution?.pending || 0 },
    { status: "In Progress", count: taskDistribution?.InProgress || 0 },
    { status: "Completed", count: taskDistribution?.Completed || 0 },
  ];

  setPieChartData(taskDistributionData);

  const PriorityLevelData = [
    { priority: "Low", count: taskPriorityLevels?.low || 0 },
    { priority: "Medium", count: taskPriorityLevels?.medium || 0 },
    { priority: "High", count: taskPriorityLevels?.high || 0 },
  ];

  setBarChartData(PriorityLevelData);
}

    const getDashboardData = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA);
            if (response.data) {
                setDashboardData(response.data);
                prepareChartData(response.data?.charts || null);
            }
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };
       

    const onSeeMore =() =>{
        navigate('/admin/tasks')
    }
     useEffect(() => {
      getDashboardData();

      return() =>{};
     }, []);
    
    return <DashboardLayout activeMenu="dashboard">
        <div className='card my-5'>
            <div>
                <div className="col-span-3">
                    <h2 className ="text-xl md:text-2xl">Hello!{user?.name}</h2>
                    <p className ="text-xs md:text-[13px] text-gray-400 mt-1.5">
                        {moment().format("dddd Do MMM YYYY")}
                    </p>
                </div>
            </div>

            <div className="grid gird-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mad:gap-6 mt-5">
                <InfoCard
                label="total Tasks"
                value={addThousandsSeparator(
                    dashboardData?.charts?.taskDistribution?.All ||0
                )}
                color="bg-primary"
                />
                 <InfoCard
                label="Pending Tasks"
                value={addThousandsSeparator(
                    dashboardData?.charts?.taskDistribution?.pending ||0
                )}
                color="bg-violet-500"
                />
                <InfoCard
                label="In Progress Tasks"
                value={addThousandsSeparator(
                    dashboardData?.charts?.taskDistribution?.InProgress ||0
                )}
                color="bg-cyan-500"
                />
                <InfoCard
                label="Completed Tasks"
                value={addThousandsSeparator(
                    dashboardData?.charts?.taskDistribution?.Completed ||0
                )}
                color="bg-lime-500"
                />
            </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6'>

           <div className="card">
  <div className="flex items-center justify-between">
    <h5 className="font-medium">Task Distribution</h5>
  </div>

  <CustomPieChart
    data={pieChartData}
    label="Total Balance"
    colors={COLORS}
  />
</div>

           <div className="card">
  <div className="flex items-center justify-between">
    <h5 className="font-medium">Task Priority Levels</h5>
  </div>

  <CustomBarChart
    data={barChartData}
    colors={COLORS}
  />
</div>

        </div>

        <div className='my-4 md:my-6'>
            <div className='card'>
                <div className='flex items-center justify-between'>
                    <h5 className="text-lg">Recent Tasks</h5>

                    <button className='card-btn' onClick={onSeeMore}>
                        See All <LuArrowRight className='text-base'/>
                    </button>
                </div>
                <TaskListTable tableData={dashboardData?.recentTasks ||  []} />
            </div>
        </div>
    </DashboardLayout>
};

export default Dashboard;
