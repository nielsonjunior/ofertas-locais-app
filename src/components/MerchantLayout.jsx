import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MerchantLayout = () => {
    return (
        <div className="merchant-layout">
            <Sidebar />
            <main className="merchant-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MerchantLayout;
