import { useState, useEffect } from 'react';
import { 
  Plus, LogOut, Link2, Copy, Trash2, QrCode, BarChart3, ChevronLeft, 
  Globe, Smartphone, Laptop, Tablet, AlertCircle, Calendar, ArrowRight,
  TrendingUp, Check, Download, LayoutDashboard, User
} from 'lucide-react';

export default function Dashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [urls, setUrls] = useState([]);
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Link Builder states
  const [newLongUrl, setNewLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  
  // Interactive UI states
  const [activeQrId, setActiveQrId] = useState(null);
  const [copiedUrlId, setCopiedUrlId] = useState(null);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch URLs on load
  useEffect(() => {
    fetchUrls();
  }, []);

  // 2. Fetch analytics when selectedUrlId changes
  useEffect(() => {
    if (selectedUrlId) {
      fetchAnalytics(selectedUrlId);
    }
  }, [selectedUrlId]);

  // API Call: Fetch URLs for the user
  const fetchUrls = async () => {
    setLoadingUrls(true);
    setError('');
    try {
      const res = await fetch('/api/urls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUrls(data);
      } else {
        setError(data.error || 'Failed to fetch URLs');
      }
    } catch (err) {
      setError('Connection failed. Could not fetch URLs.');
    } finally {
      setLoadingUrls(false);
    }
  };

  // API Call: Create short URL
  const handleCreateUrl = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newLongUrl) return;

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          longUrl: newLongUrl,
          shortCode: customCode || undefined,
          title: newTitle || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUrls([data, ...urls]);
        setNewLongUrl('');
        setCustomCode('');
        setNewTitle('');
        setSuccess('Short URL created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create short link');
      }
    } catch (err) {
      setError('Connection error. Failed to shorten URL.');
    }
  };

  // API Call: Delete short URL
  const handleDeleteUrl = async (urlId) => {
    if (!confirm('Are you sure you want to delete this short link? All click analytics history will be lost.')) return;

    try {
      const res = await fetch(`/api/urls/${urlId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUrls(urls.filter(u => u.id !== urlId));
        if (selectedUrlId === urlId) {
          setSelectedUrlId(null);
          setAnalyticsData(null);
        }
      }
    } catch (err) {
      console.error('Error deleting url:', err);
    }
  };

  // API Call: Fetch URL Analytics
  const fetchAnalytics = async (urlId) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/urls/${urlId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Helper: Copy short link
  const handleCopyLink = (urlId, shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedUrlId(urlId);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  // Helper: Get Icon for Device
  const getDeviceIcon = (device) => {
    const dev = device.toLowerCase();
    if (dev === 'desktop') return <Laptop size={16} />;
    if (dev === 'mobile') return <Smartphone size={16} />;
    if (dev === 'tablet') return <Tablet size={16} />;
    return <Laptop size={16} />;
  };

  // Helper: Calculate Custom SVG Line Chart coordinates
  const renderSvgLineChart = (clickHistory) => {
    if (!clickHistory || clickHistory.length === 0) return null;

    const width = 500;
    const height = 180;
    const padding = 35;
    
    const maxVal = Math.max(...clickHistory.map(h => h.count), 4); // ensure min scale height
    
    // Calculate points
    const points = clickHistory.map((h, i) => {
      const x = padding + (i * (width - 2 * padding) / (clickHistory.length - 1));
      const y = height - padding - (h.count * (height - 2 * padding) / maxVal);
      return { x, y, ...h };
    });

    const pathData = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Area data (close the path to fill background gradient)
    const areaData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
      : '';

    return (
      <div className="chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--purple)" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="chart-grid-line" />
          <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} className="chart-grid-line" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-grid-line" />

          {/* Fill Area */}
          {areaData && <path d={areaData} className="chart-area" />}

          {/* Line */}
          {pathData && <path d={pathData} className="chart-line" />}

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" className="chart-dot" />
              {/* Tooltip on hover */}
              <title>{`${p.date}: ${p.count} clicks`}</title>
            </g>
          ))}

          {/* X Axis Labels (Dates) */}
          {points.map((p, i) => {
            const dateObj = new Date(p.date);
            const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <text key={i} x={p.x} y={height - 10} className="chart-label-x">
                {label}
              </text>
            );
          })}

          {/* Y Axis Labels (Clicks Count) */}
          <text x={padding - 10} y={padding + 4} className="chart-label-y">{maxVal}</text>
          <text x={padding - 10} y={(height) / 2 + 4} className="chart-label-y">{Math.round(maxVal / 2)}</text>
          <text x={padding - 10} y={height - padding + 4} className="chart-label-y">0</text>
        </svg>
      </div>
    );
  };

  // Sidebar Menu Configuration (without Profile since it is in the footer)
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'links', label: 'My Links', icon: <Link2 size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'qrcodes', label: 'QR Codes', icon: <QrCode size={20} /> }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        
        {/* Collapsible Left Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Logo row (Link icon in theme purple instead of leaf) */}
          <div className="sidebar-logo-row">
            <Link2 className="sidebar-logo-icon" size={24} style={{ color: 'var(--purple)', transform: 'rotate(-45deg)' }} />
            <span className="sidebar-logo-text">URL<span style={{ color: 'var(--purple)' }}>ytics</span></span>
          </div>

          <hr className="sidebar-divider" />

          {/* Menu items */}
          <nav className="sidebar-nav">
            {sidebarItems.map(item => (
              <div
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'analytics') {
                    // Reset selected url context if switching away to another page
                    setSelectedUrlId(null);
                    setAnalyticsData(null);
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
                setActiveTab('profile');
                setSelectedUrlId(null);
                setAnalyticsData(null);
              }}
              title="Profile"
            >
              <span className="nav-item-icon"><User size={20} /></span>
              <span className="nav-item-text">Profile</span>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="dashboard-main-wrapper">
          
          {/* Sticky Navbar */}
          <header className="dashboard-navbar">
            <h2 className="navbar-page-title">
              {activeTab === 'dashboard' ? 'URLytics' : 
               activeTab === 'qrcodes' ? 'QR Codes' : 
               activeTab === 'links' ? 'My Links' : 
               activeTab === 'analytics' ? 'Analytics' : 
               activeTab === 'profile' ? 'Profile' : 
               activeTab}
            </h2>

            <div className="navbar-right">
              {/* User Email Badge */}
              <div className="user-badge-wrap">
                <span className="user-badge-avatar">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
                <span>{user?.email}</span>
              </div>
            </div>
          </header>

          {/* Dynamic main panel views */}
          <main className="dashboard-main">
            {error && (
              <div className="error-message" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message" style={{ marginBottom: '1.5rem' }}>
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* TAB 1: Dashboard Panel */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="analytics-stats-summary" style={{ marginTop: '0' }}>
                  <div className="stat-block">
                    <div className="stat-block-label">Total Short Links</div>
                    <div className="stat-block-value">{urls.length}</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-block-label">Total Redirect Clicks</div>
                    <div className="stat-block-value">{urls.reduce((acc, u) => acc + (u.clicksCount || 0), 0)}</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-block-label">Average Clicks / Link</div>
                    <div className="stat-block-value">
                      {urls.length > 0 ? (urls.reduce((acc, u) => acc + (u.clicksCount || 0), 0) / urls.length).toFixed(1) : '0.0'}
                    </div>
                  </div>
                </div>

                <div className="analytics-grid-top" style={{ gridTemplateColumns: '1fr', marginTop: '2rem' }}>
                  <div className="analytics-card">
                    <h3 className="analytics-card-title">
                      <Link2 size={18} style={{ color: 'var(--purple)' }} /> Recent Links
                    </h3>
                    {urls.length === 0 ? (
                      <div className="no-data" style={{ padding: '2rem' }}>No links shortened yet. Go to "My Links" to get started!</div>
                    ) : (
                      <div className="recent-links-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {urls.slice(0, 5).map(url => {
                          const shortUrl = `${window.location.origin}/r/${url.shortCode}`;
                          return (
                            <div key={url.id} className="link-card" style={{ padding: '1rem 1.5rem', marginBottom: '0' }}>
                              <div className="link-info">
                                <div className="link-header-row">
                                  <span className="link-title" style={{ fontSize: '1rem' }}>{url.title}</span>
                                  <span className="link-date">{new Date(url.createdAt).toLocaleDateString()}</span>
                                </div>
                                <a href={url.longUrl} target="_blank" rel="noopener noreferrer" className="link-short" style={{ fontSize: '0.9rem' }}>
                                  {shortUrl}
                                </a>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <span className="link-stats-badge">{url.clicksCount} clicks</span>
                                <button 
                                  className="btn-purple" 
                                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                  onClick={() => { setSelectedUrlId(url.id); setActiveTab('analytics'); }}
                                >
                                  View Stats
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: My Links Panel */}
            {activeTab === 'links' && (
              <div>
                {/* Link builder card */}
                <div className="link-builder-card">
                  <h3 className="link-builder-title">Create a new Short Link</h3>
                  <form onSubmit={handleCreateUrl} className="link-builder-form">
                    <div className="form-group">
                      <label htmlFor="longUrl">Destination URL</label>
                      <input
                        type="url"
                        id="longUrl"
                        className="form-input"
                        placeholder="https://example.com/very-long-url-path"
                        value={newLongUrl}
                        onChange={(e) => setNewLongUrl(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="title">Custom Title (Optional)</label>
                      <input
                        type="text"
                        id="title"
                        className="form-input"
                        placeholder="Summer Promo Campaign"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="customCode">Custom Alias (Optional)</label>
                      <input
                        type="text"
                        id="customCode"
                        className="form-input"
                        placeholder="promo2026"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="link-builder-submit">
                      <Plus size={18} /> Shorten Link
                    </button>
                  </form>
                </div>

                {/* Urls list */}
                {loadingUrls ? (
                  <div className="spinner"></div>
                ) : urls.length === 0 ? (
                  <div className="no-data">
                    <div className="empty-icon-wrap">
                      <Link2 size={48} />
                    </div>
                    <h3>No links shortened yet.</h3>
                    <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Paste a link above to get started.</p>
                  </div>
                ) : (
                  <div className="links-grid">
                    {urls.map(url => {
                      const origin = window.location.origin;
                      const shortUrl = `${origin}/r/${url.shortCode}`;
                      const isCopied = copiedUrlId === url.id;
                      const isQrOpen = activeQrId === url.id;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`;

                      return (
                        <div key={url.id} className="link-card">
                          <div className="link-info">
                            <div className="link-header-row">
                              <span className="link-title" title={url.title}>{url.title}</span>
                              <span className="link-date">
                                <Calendar size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                                {new Date(url.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <a
                                href={url.longUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-short"
                              >
                                {shortUrl} <ArrowRight size={14} />
                              </a>
                              <span className="link-long" title={url.longUrl}>{url.longUrl}</span>
                            </div>
                          </div>

                          <div className="link-actions-group">
                            <span className="link-stats-badge">
                              <TrendingUp size={14} style={{ color: 'var(--purple)' }} />
                              {url.clicksCount} clicks
                            </span>

                            <button 
                              className="btn-icon-only" 
                              style={{ position: 'relative' }}
                              onClick={() => setActiveQrId(isQrOpen ? null : url.id)}
                              title="QR Code"
                            >
                              <QrCode size={18} />
                              {isQrOpen && (
                                <div className="qr-container" onClick={(e) => e.stopPropagation()}>
                                  <button className="qr-close-btn" onClick={() => setActiveQrId(null)}>Close</button>
                                  <img src={qrImgUrl} alt="QR Code Link" width="120" height="120" />
                                  <a 
                                    href={qrImgUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={`QR-${url.shortCode}.png`}
                                    style={{
                                      fontSize: '0.8rem',
                                      color: 'var(--purple)',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}
                                  >
                                    <Download size={12} /> Save QR Code
                                  </a>
                                </div>
                              )}
                            </button>

                            <button 
                              className="btn-icon-only" 
                              onClick={() => handleCopyLink(url.id, shortUrl)}
                              title="Copy link"
                            >
                              {isCopied ? <Check size={18} style={{ color: '#10b981' }} /> : <Copy size={18} />}
                            </button>

                            <button 
                              className="btn-icon-only" 
                              onClick={() => { setSelectedUrlId(url.id); setActiveTab('analytics'); }}
                              title="View Analytics"
                            >
                              <BarChart3 size={18} />
                            </button>

                            <button 
                              className="btn-icon-only" 
                              onClick={() => handleDeleteUrl(url.id)}
                              title="Delete"
                            >
                              <Trash2 size={18} style={{ color: '#ef4444' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Analytics Panel */}
            {activeTab === 'analytics' && (
              <div>
                {!selectedUrlId ? (
                  <div>
                    <div style={{ marginBottom: '2rem' }}>
                      <h2 className="dashboard-main-title">Select a Link for Detailed Analytics</h2>
                      <p style={{ color: 'var(--gray)', marginTop: '0.5rem' }}>
                        Click on any link's card below to see detailed referral channels, clicks timeline, and visitor configurations.
                      </p>
                    </div>

                    {urls.length === 0 ? (
                      <div className="analytics-card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '3rem' }}>
                        <BarChart3 size={48} style={{ color: 'var(--purple)', marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--black)' }}>No links shortened yet</h3>
                        <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Go to the "My Links" tab to create your first short link and start tracking clicks!</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {urls.map(url => {
                          const shortUrl = `${window.location.origin}/r/${url.shortCode}`;
                          return (
                            <div 
                              key={url.id} 
                              className="analytics-url-card"
                              onClick={() => setSelectedUrlId(url.id)}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                  <span 
                                    className="link-title" 
                                    style={{ fontSize: '1.1rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }} 
                                    title={url.title}
                                  >
                                    {url.title}
                                  </span>
                                  <span className="link-date" style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--gray)', marginTop: '3px' }}>
                                    <Calendar size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                                    {new Date(url.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                                  <span className="link-short" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--purple)' }}>
                                    {shortUrl}
                                  </span>
                                  <span 
                                    className="link-long" 
                                    style={{ fontSize: '0.8rem', color: 'var(--gray)', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={url.longUrl}
                                  >
                                    {url.longUrl}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.25rem', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <TrendingUp size={16} style={{ color: 'var(--purple)' }} />
                                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--black)' }}>
                                    {url.clicksCount || 0}
                                  </span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: '500' }}>
                                    clicks
                                  </span>
                                </div>
                                <button 
                                  className="btn-purple" 
                                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUrlId(url.id);
                                  }}
                                >
                                  View Report
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Detailed Subview */
                  <div>
                    <button className="btn-back" onClick={() => { setSelectedUrlId(null); setAnalyticsData(null); }}>
                      <ChevronLeft size={18} /> Back to selection list
                    </button>

                    {loadingAnalytics || !analyticsData ? (
                      <div className="spinner"></div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: '2.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 className="dashboard-main-title" style={{ wordBreak: 'break-all', maxWidth: '70%' }}>
                              Analytics: {analyticsData.url.title}
                            </h2>
                            <div className="link-actions-group">
                              <button 
                                className="btn-purple" 
                                onClick={() => handleCopyLink(analyticsData.url.id, `${window.location.origin}/r/${analyticsData.url.shortCode}`)}
                              >
                                {copiedUrlId === analyticsData.url.id ? 'Copied!' : 'Copy Short URL'}
                              </button>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--gray)', wordBreak: 'break-all', display: 'block', marginTop: '0.4rem' }}>
                            Redirects to: <a href={analyticsData.url.longUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)' }}>{analyticsData.url.longUrl}</a>
                          </span>
                        </div>

                        {/* Top Stats Summary Blocks */}
                        <div className="analytics-stats-summary">
                          <div className="stat-block">
                            <div className="stat-block-label">Total Redirects</div>
                            <div className="stat-block-value">{analyticsData.totalClicks}</div>
                          </div>

                          <div className="stat-block">
                            <div className="stat-block-label">Top Referrer Source</div>
                            <div className="stat-block-value" style={{ fontSize: '1.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {Object.keys(analyticsData.analytics.referrers).sort((a,b) => analyticsData.analytics.referrers[b] - analyticsData.analytics.referrers[a])[0] || 'Direct'}
                            </div>
                          </div>

                          <div className="stat-block">
                            <div className="stat-block-label">Primary Device</div>
                            <div className="stat-block-value" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {Object.keys(analyticsData.analytics.devices).sort((a,b) => analyticsData.analytics.devices[b] - analyticsData.analytics.devices[a])[0] || 'Desktop'}
                            </div>
                          </div>

                          <div className="stat-block">
                            <div className="stat-block-label">Top Browser</div>
                            <div className="stat-block-value" style={{ fontSize: '1.3rem' }}>
                              {Object.keys(analyticsData.analytics.browsers).sort((a,b) => analyticsData.analytics.browsers[b] - analyticsData.analytics.browsers[a])[0] || 'Chrome'}
                            </div>
                          </div>
                        </div>

                        {/* SVG Chart & Referrers Grid */}
                        <div className="analytics-grid-top">
                          {/* SVG Line Chart */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">
                              <TrendingUp size={18} style={{ color: 'var(--purple)' }} /> Clicks Timeline (Last 7 Days)
                            </h3>
                            {renderSvgLineChart(analyticsData.analytics.clickHistory)}
                          </div>

                          {/* Referrers list */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">
                              <Globe size={18} style={{ color: 'var(--purple)' }} /> Traffic Channels
                            </h3>
                            {Object.keys(analyticsData.analytics.referrers).length === 0 ? (
                              <div className="no-data" style={{ padding: '2rem' }}>No referrer data logged yet.</div>
                            ) : (
                              <div className="breakdown-list">
                                {Object.entries(analyticsData.analytics.referrers)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 5)
                                  .map(([source, count]) => {
                                    const percent = (count / analyticsData.totalClicks) * 100;
                                    return (
                                      <div key={source} className="breakdown-item">
                                        <div className="breakdown-label-wrap">
                                          <span>{source}</span>
                                        </div>
                                        <div className="breakdown-bar-container">
                                          <div className="breakdown-bar" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="breakdown-value">{count}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Devices, Browsers, and Visitors Tables */}
                        <div className="analytics-grid-top" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          {/* Device & Browser Card */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">Audience Tech Breakdown</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                              <div>
                                <h4 style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.8rem', fontWeight: 700 }}>DEVICE TYPES</h4>
                                {Object.keys(analyticsData.analytics.devices).length === 0 ? (
                                  <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>No device data logged.</p>
                                ) : (
                                  <div className="breakdown-list">
                                    {Object.entries(analyticsData.analytics.devices).map(([device, count]) => (
                                      <div key={device} className="breakdown-item">
                                        <div className="breakdown-label-wrap">
                                          {getDeviceIcon(device)}
                                          <span style={{ textTransform: 'capitalize' }}>{device}</span>
                                        </div>
                                        <div className="breakdown-bar-container">
                                          <div className="breakdown-bar" style={{ width: `${(count / analyticsData.totalClicks) * 100}%` }}></div>
                                        </div>
                                        <span className="breakdown-value">{count}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.8rem', fontWeight: 700 }}>BROWSERS</h4>
                                {Object.keys(analyticsData.analytics.browsers).length === 0 ? (
                                  <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>No browser data logged.</p>
                                ) : (
                                  <div className="breakdown-list">
                                    {Object.entries(analyticsData.analytics.browsers).map(([browser, count]) => (
                                      <div key={browser} className="breakdown-item">
                                        <div className="breakdown-label-wrap">
                                          <Globe size={16} />
                                          <span>{browser}</span>
                                        </div>
                                        <div className="breakdown-bar-container">
                                          <div className="breakdown-bar" style={{ width: `${(count / analyticsData.totalClicks) * 100}%` }}></div>
                                        </div>
                                        <span className="breakdown-value">{count}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Recent Clicks list */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">Recent Referrals Log</h3>
                            {analyticsData.analytics.recentVisits.length === 0 ? (
                              <div className="no-data" style={{ padding: '2rem' }}>No clicks logged yet.</div>
                            ) : (
                              <div className="recent-visits-table-wrapper">
                                <table className="visits-table">
                                  <thead>
                                    <tr>
                                      <th>Timestamp</th>
                                      <th>Referrer</th>
                                      <th>Device</th>
                                      <th>Browser</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {analyticsData.analytics.recentVisits.map(visit => {
                                      const visitTime = new Date(visit.timestamp);
                                      return (
                                        <tr key={visit.id}>
                                          <td style={{ whiteSpace: 'nowrap' }}>
                                            {visitTime.toLocaleDateString()} {visitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </td>
                                          <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {visit.referrer}
                                          </td>
                                          <td style={{ textTransform: 'capitalize' }}>{visit.device}</td>
                                          <td>{visit.browser}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: QR Codes Panel */}
            {activeTab === 'qrcodes' && (
              <div>
                {urls.length === 0 ? (
                  <div className="no-data">
                    <QrCode size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <h3>No QR Codes available yet.</h3>
                    <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Create a short link in "My Links" to auto-generate its QR code.</p>
                  </div>
                ) : (
                  <div className="qrcodes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                    {urls.map(url => {
                      const shortUrl = `${window.location.origin}/r/${url.shortCode}`;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
                      return (
                        <div key={url.id} className="analytics-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem' }}>
                          <span className="link-title" style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={url.title}>
                            {url.title}
                          </span>
                          <a href={shortUrl} target="_blank" rel="noreferrer" className="link-short" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            {url.shortCode}
                          </a>
                          
                          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px dashed var(--border-color)' }}>
                            <img src={qrImgUrl} alt="QR Code" width="160" height="160" style={{ display: 'block' }} />
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                            <button 
                              className="btn-purple-secondary" 
                              style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                              onClick={() => handleCopyLink(url.id, shortUrl)}
                            >
                              {copiedUrlId === url.id ? 'Copied!' : 'Copy Link'}
                            </button>
                            <a 
                              href={qrImgUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={`QR-${url.shortCode}.png`}
                              className="btn-purple"
                              style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            >
                              <Download size={14} /> Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Profile Panel */}
            {activeTab === 'profile' && (
              <div style={{ maxWidth: '600px' }}>
                <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem' }}>
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--purple)',
                      color: 'var(--white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      marginBottom: '1.5rem',
                      boxShadow: 'var(--glow-purple)'
                    }}
                  >
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--black)' }}>{user?.email}</h3>
                  <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '2rem' }}>Registered User</p>

                  <div 
                    style={{
                      width: '100%',
                      borderTop: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      padding: '1.5rem 0',
                      marginBottom: '2rem',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <span style={{ color: 'var(--gray)', fontWeight: 500 }}>Email Address</span>
                      <span style={{ fontWeight: 600, color: 'var(--soft-black)' }}>{user?.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray)', fontWeight: 500 }}>Account Type</span>
                      <span style={{ fontWeight: 600, color: 'var(--purple)' }}>Free Account</span>
                    </div>
                  </div>

                  <button className="btn-danger" onClick={onLogout} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}>
                    <LogOut size={18} /> Log Out from Account
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
