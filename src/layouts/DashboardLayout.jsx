import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

export default function DashboardLayout({
  activeTab,
  handleTabChange,
  currentUser,
  setAnalyticsData,
  searchQuery,
  setSearchQuery,
  children
}) {
  const [isSidebarLocked, setIsSidebarLocked] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <Sidebar
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          currentUser={currentUser}
          setAnalyticsData={setAnalyticsData}
          isLocked={isSidebarLocked}
          setIsLocked={setIsSidebarLocked}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className={`dashboard-main-wrapper ${isSidebarLocked ? 'shifted' : ''}`}>
          <Navbar
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentUser={currentUser}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />
          <main className="dashboard-main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
