import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SidebarComponent from './SidebarComponent';

const Layout = () => { 
  // 1. Create the state for the mobile menu
  const [toggled, setToggled] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
        {/* 2. Pass toggled and setToggled to Sidebar */}
        <SidebarComponent toggled={toggled} setToggled={setToggled} />

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col min-w-0 bg-gray-100">
          {/* Scrollable Content Section */}
          <section className="flex-grow overflow-y-auto p-0 relative">
              <div className="bg-white p-0 shadow min-h-full pb-16">
                {/* 3. Pass a function to Navbar to open the menu */}
                <Navbar onMenuClick={() => setToggled(true)} />
                <Outlet /> 
              </div>
          </section>
        </main>
    </div>
  );
};

export default Layout;