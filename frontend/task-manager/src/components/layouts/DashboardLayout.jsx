import React, { useContext } from 'react'
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({children, activeMenu}) => {
    const { user } = useContext(UserContext);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar activeMenu={activeMenu} />
            {user && (
                <div className="flex">
                    <div className="w-64">
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                    <div className="flex-1 p-6">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};
export default DashboardLayout