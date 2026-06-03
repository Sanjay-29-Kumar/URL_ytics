import { useState } from 'react';
import { Link2, LayoutDashboard, BarChart3, QrCode, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Sidebar({ activeTab, handleTabChange, currentUser, setAnalyticsData, isLocked, setIsLocked, isMobileOpen, setIsMobileOpen }) {
  const [isHovered, setIsHovered] = useState(false);
  const isOpen = isLocked || isHovered;

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'links', label: 'My Links', icon: <Link2 size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'qrcodes', label: 'QR Codes', icon: <QrCode size={20} /> }
  ];

  return (
    <aside 
      className={`dashboard-sidebar ${isOpen ? 'expanded' : ''} ${isMobileOpen ? 'open' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo row with collapse/lock functionality */}
      <div className="sidebar-logo-row" style={{ justifyContent: isOpen ? 'space-between' : 'center', padding: isOpen ? '0 0.65rem' : '0' }}>
        {isOpen && (
          <span className="sidebar-logo-text" style={{ opacity: 1 }}>URL<span style={{ color: 'var(--purple)' }}>ytics</span></span>
        )}
        <button 
          onClick={() => setIsLocked(!isLocked)} 
          className="sidebar-toggle-btn"
          title={isLocked ? "Collapse/Float Sidebar" : "Dock/Lock Sidebar"}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'var(--purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isLocked ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <hr className="sidebar-divider" />

      {/* Menu items */}
      <nav className="sidebar-nav">
        {sidebarItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => {
              handleTabChange(item.id);
              if (item.id !== 'analytics' && setAnalyticsData) {
                // Reset selected url context if switching away to another page
                setAnalyticsData(null);
              }
              if (setIsMobileOpen) {
                setIsMobileOpen(false);
              }
            }}
            title={item.label}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer (Profile item matching image position instead of logout) */}
      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <div
          className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            handleTabChange('profile');
            if (setAnalyticsData) {
              setAnalyticsData(null);
            }
            if (setIsMobileOpen) {
              setIsMobileOpen(false);
            }
          }}
          title="Profile"
        >
          <span className="nav-item-icon">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt="Avatar" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <User size={20} />
            )}
          </span>
          <span className="nav-item-text">Profile</span>
        </div>
      </div>
    </aside>
  );
}
