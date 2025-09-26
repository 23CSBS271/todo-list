import React from 'react';
import UI_IMG from "../../assets/images/auth-img.png";

const AuthLayout = ({children}) => {
    return (
        <div className="flex">
            <div className="w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12">
                <h2 className="text-lg font-medium text-black">Task Manager</h2>
                {children}
            </div>

            <div className="hidden md:flex w-[40vw] h-screen items-center bg-blue-50 bg-[url('/bg-img.jpg')] bg-cover bg-no-repeat bg-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={UI_IMG}
                        className="w-64 lg:w-[90%] object-contain"
                        alt="Authentication"
                        style={{
                            backgroundColor: 'transparent',
                            filter: 'brightness(1.5) contrast(1.4) saturate(1.2)',
                            mixBlendMode: 'lighten',
                            opacity: 1
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
