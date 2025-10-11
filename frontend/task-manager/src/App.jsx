import React, { useContext } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Outlet,
} from "react-router-dom";
import Dashboard from './pages/Admin/Dashboard';
import Login from './pages/Auth/login';
import SignUp from './pages/Auth/SignUp';
import ManageTasks from './pages/Admin/ManageTasks';
import CreateTask from './pages/Admin/CreateTask';
import ManageUsers from './pages/Admin/ManageUsers';
import UserDashboard from './pages/User/UserDashboard';
import MyTasks from './pages/User/MyTasks';
import PrivateRoute from './routes/PrivateRoute';
import ViewTaskDetails from './pages/User/ViewTaskDetails';
import Calendar from './pages/Calendar';
import Boards from './pages/Boards';
import Board from './pages/Board';
import UserProvider, { UserContext } from "./context/userContext";
import { SocketProvider } from './context/socketContext';
import { Toaster } from 'react-hot-toast';

const App = () => {
    return (
        <SocketProvider>
            <UserProvider>
                <div>
                    <Router>
                        <Routes>
                            {/* Public Routes */}
                            <Route path='/login' element={<Login />} />
                            <Route path='/signup' element={<SignUp />} />

                            {/* Admin Routes */}
                            <Route element={<PrivateRoute allowedRoles={["admin", "user"]} />}>
                                <Route path='/admin/dashboard' element={<Dashboard />} />
                                <Route path='/admin/tasks' element={<ManageTasks />} />
                                <Route path='/admin/create-task' element={<CreateTask />} />
                                <Route path='/admin/users' element={<ManageUsers />} />
                                <Route path='/calendar' element={<Calendar />} />
                                <Route path='/boards' element={<Boards />} />
                                <Route path='/board/:boardId' element={<Board />} />
                            </Route>

                            {/* User Routes */}
                            <Route element={<PrivateRoute allowedRoles={["user"]} />}>
                                <Route path='/user/dashboard' element={<UserDashboard />} />
                                <Route path='/user/tasks' element={<MyTasks />} />
                                <Route path='/user/task-details/:id' element={<ViewTaskDetails />} />
                            </Route>
                            {/* Default Route */}
                            <Route path="/" element={<Root />} />
                        </Routes>
                    </Router>
                </div>
                <Toaster
                toastOptions={{
                    className:"",
                    style:{
                        fontSize:"13px",
                    },
                }}
                />
            </UserProvider>
        </SocketProvider>
    );
};

export default App;

const Root = () => {
    const { user, loading } = useContext(UserContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }
    return user.role === "admin" ? <Navigate to="/admin/dashboard" /> : <Navigate to="/user/dashboard" />;
};
