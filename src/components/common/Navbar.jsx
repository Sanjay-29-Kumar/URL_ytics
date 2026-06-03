import { Search, Menu, X } from 'lucide-react';

export default function Navbar({ activeTab, searchQuery, setSearchQuery, currentUser, isMobileOpen, setIsMobileOpen }) {
  return (
    <header className="dashboard-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          className="hamburger" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="navbar-page-title">
          {activeTab === 'dashboard' ? (
            <>URL<span style={{ color: 'var(--purple)', fontFamily: 'var(--font-sans)' }}>ytics</span></>
          ) : (
            activeTab === 'qrcodes' ? 'QR Codes' :
              activeTab === 'links' ? 'My Links' :
                activeTab === 'analytics' ? 'Analytics' :
                  activeTab === 'profile' ? 'Profile' :
                    activeTab
          )}
        </h2>
      </div>

      {activeTab === 'links' && (
        <div className="navbar-search-container">
          <Search size={16} className="navbar-search-icon" />
          <input 
            type="text" 
            placeholder="Search links by title, url or shortcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-input"
          />
        </div>
      )}

      <div className="navbar-right">
        {/* User Email Badge */}
        <div className="user-badge-wrap">
          {currentUser?.profilePicture ? (
            <img src={currentUser.profilePicture} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span className="user-badge-avatar">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
            </span>
          )}
          <span>{currentUser?.name || currentUser?.email}</span>
        </div>
      </div>
    </header>
  );
}
