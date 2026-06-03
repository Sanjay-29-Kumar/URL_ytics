import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Plus, LogOut, Link2, Copy, Trash2, QrCode, BarChart3, ChevronLeft,
  Globe, Smartphone, Laptop, Tablet, AlertCircle, Calendar, ArrowRight,
  TrendingUp, Check, Download, LayoutDashboard, User, Clock, Pencil, X,
  Shield, Power, MapPin, Eye, EyeOff, FileDown, Search
} from 'lucide-react';
import defaultProfilePng from '../assets/profile.png';
import { LineChart } from '@mui/x-charts/LineChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  getUrls,
  createUrl as apiCreateUrl,
  updateUrl as apiUpdateUrl,
  deleteUrl as apiDeleteUrl,
  getAnalytics,
  getExportCsvUrl
} from '../services/urlService';
import { updateProfile as apiUpdateProfile } from '../services/authService';

export default function Dashboard({ user, token, onLogout }) {
  const { tab, urlId: routeUrlId } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'dashboard';
  const selectedUrlId = routeUrlId || null;

  const handleTabChange = (newTab) => {
    if (newTab === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${newTab}`);
    }
  };
  const [urls, setUrls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Profile states
  const [currentUser, setCurrentUser] = useState(user);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePic, setProfilePic] = useState(user?.profilePicture || '');
  const [smsAlerts, setSmsAlerts] = useState(user?.smsAlerts || false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const fileInputRef = useRef(null);

  // Sync profile states with user changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileEmail(currentUser.email || '');
      setProfilePic(currentUser.profilePicture || '');
      setSmsAlerts(currentUser.smsAlerts || false);
    }
  }, [currentUser]);

  // Profile Save handler
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const data = await apiUpdateProfile(token, {
        name: profileName,
        phone: profilePhone,
        profilePicture: profilePic,
        smsAlerts: smsAlerts
      });
      setProfileSuccess('Profile saved successfully!');
      setCurrentUser(data.user);
      localStorage.setItem('urlytics_user', JSON.stringify(data.user));
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Profile Picture file selection
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setProfileError('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const [analyticsData, setAnalyticsData] = useState(null);

  // Link Builder states
  const [newLongUrl, setNewLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Interactive UI states
  const [activeQrId, setActiveQrId] = useState(null);
  const [copiedUrlId, setCopiedUrlId] = useState(null);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal states
  const [editingUrl, setEditingUrl] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLongUrl, setEditLongUrl] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  // 3. Real-time click counter — poll every 10s when on dashboard/analytics
  useEffect(() => {
    if (activeTab !== 'dashboard' && activeTab !== 'analytics') return;
    const interval = setInterval(() => {
      getUrls(token)
        .then(data => { if (data) setUrls(data); })
        .catch(() => { });
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, token]);

  // API Call: Fetch URLs for the user
  const fetchUrls = async () => {
    setLoadingUrls(true);
    setError('');
    try {
      const data = await getUrls(token);
      setUrls(data);
    } catch (err) {
      setError(err.message || 'Connection failed. Could not fetch URLs.');
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
      const data = await apiCreateUrl(token, {
        longUrl: newLongUrl,
        shortCode: customCode || undefined,
        title: newTitle || undefined,
        expiresAt: expiresAt || undefined,
        password: newPassword || undefined
      });
      setUrls([data, ...urls]);
      setNewLongUrl('');
      setCustomCode('');
      setNewTitle('');
      setExpiresAt('');
      setNewPassword('');
      setSuccess('Short URL created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Connection error. Failed to shorten URL.');
    }
  };

  // Open edit modal for a URL
  const openEditModal = (url) => {
    setEditingUrl(url);
    setEditTitle(url.title || '');
    setEditLongUrl(url.longUrl || '');
    setEditExpiresAt(url.expiresAt ? new Date(url.expiresAt).toISOString().slice(0, 16) : '');
    setEditPassword('');
    setEditIsActive(url.isActive !== false);
  };

  // Quick toggle isActive without opening modal
  const handleToggleActive = async (url) => {
    try {
      const data = await apiUpdateUrl(token, url.id, { isActive: !url.isActive });
      setUrls(urls.map(u => u.id === url.id ? data : u));
    } catch { /* ignore */ }
  };

  // Export analytics CSV for a URL
  const handleExportCsv = (urlId) => {
    window.open(getExportCsvUrl(urlId), '_blank');
  };

  // API Call: Update URL
  const handleUpdateUrl = async () => {
    if (!editingUrl) return;
    setIsSavingEdit(true);
    setError('');
    try {
      const body = {
        title: editTitle,
        longUrl: editLongUrl,
        expiresAt: editExpiresAt || null,
        isActive: editIsActive
      };
      // Only send password field if user typed something (empty string = remove password)
      if (editPassword !== '') body.password = editPassword;

      const data = await apiUpdateUrl(token, editingUrl.id, body);
      setUrls(urls.map(u => u.id === editingUrl.id ? data : u));
      setEditingUrl(null);
      setSuccess('Link updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Connection error. Failed to update link.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // API Call: Delete short URL
  const handleDeleteUrl = async (urlId) => {
    if (!confirm('Are you sure you want to delete this short link? All click analytics history will be lost.')) return;

    try {
      await apiDeleteUrl(token, urlId);
      setUrls(urls.filter(u => u.id !== urlId));
      if (selectedUrlId === urlId) {
        setAnalyticsData(null);
      }
    } catch (err) {
      console.error('Error deleting url:', err);
    }
  };

  // API Call: Fetch URL Analytics
  const fetchAnalytics = async (urlId) => {
    setLoadingAnalytics(true);
    try {
      const data = await getAnalytics(token, urlId);
      setAnalyticsData(data);
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
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  const renderSvgLineChart = (clickHistory) => {
    if (!clickHistory || clickHistory.length === 0) return null;

    const xData = clickHistory.map(h => new Date(h.date));
    const yData = clickHistory.map(h => h.count);

    return (
      <ThemeProvider theme={lightTheme}>
        <div style={{ width: '100%', height: 350, backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px' }}>
          <LineChart
            xAxis={[{
              data: xData,
              scaleType: 'time',
              valueFormatter: (value) => value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              tickLabelStyle: { fill: '#64748b' }
            }]}
            yAxis={[{
              min: 0,
              tickLabelStyle: { fill: '#64748b' },
              valueFormatter: (value) => Number.isInteger(value) ? value.toString() : '',
            }]}
            series={[
              {
                id: 'Clicks',
                data: yData,
                area: true,
                color: '#a287e29d',
                showMark: false,
              },
            ]}
            slotProps={{
               popper: {
                 sx: {
                   '& .MuiChartsTooltip-root': {
                     backgroundColor: '#ffffff',
                     color: '#0f172a',
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                     border: '1px solid #e2e8f0'
                   }
                 }
               }
            }}
            sx={{
              '& .MuiChartsAxis-line': { stroke: '#cbd5e1' },
              '& .MuiChartsAxis-tick': { stroke: '#cbd5e1' },
              '& .MuiAreaElement-series-Clicks': {
                fill: "url('#purpleGradient')",
              },
              '& .MuiLineElement-series-Clicks': {
                stroke: '#8b5cf6',
              },
            }}
            margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
          >
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
          </LineChart>
        </div>
      </ThemeProvider>
    );
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      handleTabChange={handleTabChange}
      currentUser={currentUser}
      setAnalyticsData={setAnalyticsData}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
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
              <div className="dashboard-split-layout">

                {/* LEFT COLUMN — Create Short Link form */}
                <div className="dashboard-split-left">
                  <div className="link-builder-card" style={{ boxShadow: 'none', border: '1.5px solid var(--border-color)', marginBottom: 0 }}>
                    <h3 className="link-builder-title">Create a Short Link</h3>
                    <form onSubmit={handleCreateUrl} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group">
                        <label htmlFor="db-longUrl">Destination URL*</label>
                        <input
                          type="url"
                          id="db-longUrl"
                          className="form-input"
                          placeholder="https://example.com/very-long-url-path"
                          value={newLongUrl}
                          onChange={(e) => setNewLongUrl(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="db-title">Title</label>
                        <input
                          type="text"
                          id="db-title"
                          className="form-input"
                          placeholder="Summer Promo"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="db-customCode">Custom Alias</label>
                        <input
                          type="text"
                          id="db-customCode"
                          className="form-input"
                          placeholder="promo2026"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="db-expiresAt">Expiration</label>
                        <input
                          type="datetime-local"
                          id="db-expiresAt"
                          className="form-input"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>

                      <div className="form-group" style={{ position: 'relative' }}>
                        <label htmlFor="db-newPassword">Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            id="db-newPassword"
                            className="form-input"
                            placeholder="Protect this link"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{ paddingRight: '2.5rem' }}
                          />
                          <button type="button" onClick={() => setShowNewPassword(p => !p)}
                            style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 0 }}>
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="link-builder-submit" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <Plus size={18} /> Shorten Link
                      </button>
                    </form>
                  </div>
                </div>

                {/* RIGHT COLUMN — My Links list */}
                <div className="dashboard-split-right">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--black)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* <Link2 size={18} style={{ color: 'var(--purple)' }} />  */}
                      My Links
                    </h3>
                    {/* <span style={{ fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 600 }}>{urls.length} link{urls.length !== 1 ? 's' : ''}</span> */}
                  </div>

                  {loadingUrls ? (
                    <div className="spinner"></div>
                  ) : urls.length === 0 ? (
                    <div className="no-data" style={{ padding: '3rem', textAlign: 'center' }}>
                      <Link2 size={40} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--gray)' }}>Create your first short link using the form on the left.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', paddingRight: '4px' }}>
                      {urls.map(url => {
                        const shortUrl = `${import.meta.env.VITE_API_URL || window.location.origin}/r/${url.shortCode}`;
                        const isCopied = copiedUrlId === url.id;
                        return (
                          <div key={url.id} className={`link-card ${url.isActive === false ? 'link-card--disabled' : ''}`} style={{ padding: '1rem 1.25rem', marginBottom: 0 }}>
                            <div className="link-info">
                              <div className="link-header-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span className="link-title" style={{ fontSize: '0.95rem' }} title={url.title}>{url.title}</span>
                                  {url.password && <span className="link-badge link-badge--lock">Protected</span>}
                                  {url.isActive === false && <span className="link-badge link-badge--off">Disabled</span>}
                                </div>
                                <span className="link-date">{new Date(url.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.3rem' }}>
                                <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="link-short" style={{ fontSize: '0.85rem' }}>
                                  {shortUrl} <ArrowRight size={12} />
                                </a>
                                <span className="link-long" style={{ fontSize: '0.78rem' }} title={url.longUrl}>{url.longUrl}</span>
                              </div>
                            </div>
                            <div className="link-actions-group" style={{ gap: '0.3rem' }}>
                              <button className="btn-icon-only" onClick={() => handleCopyLink(url.id, shortUrl)} title="Copy">
                                {isCopied ? <Check size={16} style={{ color: 'var(--purple)' }} /> : <Copy size={16} />}
                              </button>
                              <button className="btn-icon-only" onClick={() => navigate('/dashboard/analytics/' + url.id)} title="Analytics">
                                <BarChart3 size={16} />
                              </button>
                              <button className="btn-icon-only" onClick={() => handleToggleActive(url)} title={url.isActive === false ? 'Enable' : 'Disable'}>
                                <Power size={16} style={{ color: url.isActive === false ? 'var(--gray)' : 'var(--purple)' }} />
                              </button>
                              <button className="btn-icon-only" onClick={() => openEditModal(url)} title="Edit">
                                <Pencil size={16} />
                              </button>
                              <button className="btn-icon-only" onClick={() => handleDeleteUrl(url.id)} title="Delete">
                                <Trash2 size={16} style={{ color: '#ef4444' }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: My Links Panel */}
            {activeTab === 'links' && (
              <div>

                {/* Urls list */}
                {loadingUrls ? (
                  <div className="spinner"></div>
                ) : urls.length === 0 ? (
                  <div className="no-data">
                    <div className="empty-icon-wrap">
                      <Link2 size={48} />
                    </div>
                    <h3>No links shortened yet</h3>
                    <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Paste a link above to get started.</p>
                  </div>
                ) : (
                  <div className="links-grid">
                    {urls.filter(u => u.title?.toLowerCase().includes(searchQuery.toLowerCase()) || u.longUrl?.toLowerCase().includes(searchQuery.toLowerCase()) || u.shortCode?.toLowerCase().includes(searchQuery.toLowerCase())).map(url => {
                      const shortUrl = `${import.meta.env.VITE_API_URL || window.location.origin}/r/${url.shortCode}`;
                      const isCopied = copiedUrlId === url.id;
                      const isQrOpen = activeQrId === url.id;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`;

                      return (
                        <div key={url.id} className={`link-card ${url.isActive === false ? 'link-card--disabled' : ''}`}>
                          <div className="link-info">
                            <div className="link-header-row">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="link-title" title={url.title}>{url.title}</span>
                                {url.password && <span className="link-badge link-badge--lock" title="Password protected">
                                  {/* <Shield size={11} />  */}
                                Protected</span>}
                                {url.isActive === false && <span className="link-badge link-badge--off">Disabled</span>}
                                {/* <Power size={11} /> */}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {url.expiresAt && (() => {
                                  const isExpired = new Date(url.expiresAt) < new Date();
                                  const timeLeft = new Date(url.expiresAt) - new Date();
                                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                                  const daysLeft = Math.floor(hoursLeft / 24);
                                  return (
                                    <span className={`expiry-badge ${isExpired ? 'expiry-badge--expired' : hoursLeft < 24 ? 'expiry-badge--soon' : 'expiry-badge--active'}`}>
                                      {/* <Clock size={11} /> */}
                                      {isExpired ? 'Expired' : daysLeft > 0 ? `${daysLeft}d left` : `${hoursLeft}h left`}
                                    </span>
                                  );
                                })()}
                                <span className="link-date">
                                  {/* <Calendar size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> */}
                                  {new Date(url.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <a
                                href={shortUrl}
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
                            {/* <span className="link-stats-badge">
                              <TrendingUp size={14} style={{ color: 'var(--purple)' }} />
                              {url.clicksCount} clicks
                            </span> */}

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
                              {isCopied ? <Check size={18} style={{ color: '#8b5cf6' }} /> : <Copy size={18} />}
                            </button>

                            <button
                              className="btn-icon-only"
                              onClick={() => navigate('/dashboard/analytics/' + url.id)}
                              title="View Analytics"
                            >
                              <BarChart3 size={18} />
                            </button>

                            <button
                              className="btn-icon-only"
                              onClick={() => handleToggleActive(url)}
                              title={url.isActive === false ? 'Enable link' : 'Disable link'}
                            >
                              <Power size={18} style={{ color: url.isActive === false ? 'var(--gray)' : 'var(--purple)' }} />
                            </button>

                            <button
                              className="btn-icon-only"
                              onClick={() => openEditModal(url)}
                              title="Edit link"
                            >
                              <Pencil size={18} />
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
                          const shortUrl = `${import.meta.env.VITE_API_URL || window.location.origin}/r/${url.shortCode}`;
                          return (
                            <div
                              key={url.id}
                              className="analytics-url-card"
                              onClick={() => navigate('/dashboard/analytics/' + url.id)}
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
                                    navigate('/dashboard/analytics/' + url.id);
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
                    <button className="btn-back" onClick={() => { 
                      navigate('/dashboard/analytics');
                      setAnalyticsData(null); 
                    }}>
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
                                onClick={() => handleExportCsv(analyticsData.url.id)}
                              >
                                <FileDown size={18} /> Export CSV
                              </button>
                              <button
                                className="btn-purple"
                                onClick={() => handleCopyLink(analyticsData.url.id, `${import.meta.env.VITE_API_URL || window.location.origin}/r/${analyticsData.url.shortCode}`)}
                              >
                                {copiedUrlId === analyticsData.url.id ? 'Copied!' : 'Copy Short URL'}
                              </button>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--gray)', wordBreak: 'break-all', display: 'block', marginTop: '0.4rem' }}>
                            Redirects to: <a href={analyticsData.url.longUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)' }}>{analyticsData.url.longUrl}</a>
                          </span>
                        </div>

                        {/* Top Stats Summary Blocks
                        <div className="analytics-stats-summary">
                          <div className="stat-block">
                            <div className="stat-block-label">Total Redirects</div>
                            <div className="stat-block-value">{analyticsData.totalClicks}</div>
                          </div>

                          <div className="stat-block">
                            <div className="stat-block-label">Top Referrer Source</div>
                            <div className="stat-block-value" style={{ fontSize: '1.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {Object.keys(analyticsData.analytics.referrers).sort((a, b) => analyticsData.analytics.referrers[b] - analyticsData.analytics.referrers[a])[0] || 'Direct'}
                            </div>
                          </div>

                          <div className="stat-block">
                            <div className="stat-block-label">Primary Device</div>
                            <div className="stat-block-value" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {Object.keys(analyticsData.analytics.devices).sort((a, b) => analyticsData.analytics.devices[b] - analyticsData.analytics.devices[a])[0] || 'Desktop'}
                            </div>
                          </div>

                          <div className="stat-block">
                            <div className="stat-block-label">Top Browser</div>
                            <div className="stat-block-value" style={{ fontSize: '1.3rem' }}>
                              {Object.keys(analyticsData.analytics.browsers).sort((a, b) => analyticsData.analytics.browsers[b] - analyticsData.analytics.browsers[a])[0] || 'Chrome'}
                            </div>
                          </div>
                        </div> */}

                        {/* 3-Column Grid above the Timeline */}
                        <div className="analytics-top-grid">

                          {/* 1. Audience Tech Breakdown */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">Audience Tech</h3>
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

                          {/* 2. Traffic Channels */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">
                              {/* <Globe size={18} style={{ color: 'var(--purple)' }} /> */}
                              Traffic Channels
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

                          {/* 3. Recent Referrals Log */}
                          <div className="analytics-card">
                            <h3 className="analytics-card-title">Logs</h3>
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
                                      <th>Location</th>
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
                                          <td>{visit.country ? `${visit.country}${visit.city ? `, ${visit.city}` : ''}` : '—'}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SVG Line Chart (Clicks Timeline) below in a full-width card with white background */}
                        <div className="analytics-card timeline-card" style={{ width: '100%' }}>
                          <h3 className="analytics-card-title">
                            {/* <TrendingUp size={18} style={{ color: 'var(--purple)' }} /> */}
                            Clicks Timeline
                          </h3>
                          {renderSvgLineChart(analyticsData.analytics.clickHistory)}
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
                      const shortUrl = `${import.meta.env.VITE_API_URL || window.location.origin}/r/${url.shortCode}`;
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
              <div className="profile-split-card analytics-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Left Column: Profile Picture / Photo Manager */}
                <div className="profile-left-col">
                  <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={profilePic || defaultProfilePng}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt="Profile Avatar"
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: '15px', left: '15px', color: 'white', textAlign: 'left' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{profileName || 'Your Portrait'}</h4>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', background: 'white' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="btn-purple"
                      style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: 'none', cursor: 'pointer' }}
                    >
                      <User size={16} /> Change Profile Photo
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePicChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Right Column: Profile Form Details */}
                <div className="profile-right-col" style={{ textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                  {/* Decorative corner rotated square background */}
                  <div style={{
                    position: 'absolute',
                    width: '360px',
                    height: '360px',
                    background: 'rgba(138, 92, 246, 0.35)',
                    transform: 'rotate(45deg)',
                    top: '-160px',
                    right: '-160px',
                    borderRadius: '48px',
                    pointerEvents: 'none',
                    zIndex: 0
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--black)', margin: 0 }}>My profile</h3>
                    </div>
                  </div>

                  {/* Success / Error Messages */}
                  {profileSuccess && <div className="success-message" style={{ marginBottom: '1.2rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}>{profileSuccess}</div>}
                  {profileError && <div className="error-message" style={{ marginBottom: '1.2rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}>{profileError}</div>}

                  {/* Name and Phone Row */}
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Full Name</label>
                      <input
                        type="text"
                        placeholder="Sami Rahman"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 0', outline: 'none', fontSize: '0.95rem', background: 'transparent' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 98123-xxxxx"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 0', outline: 'none', fontSize: '0.95rem', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      disabled
                      style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 0', outline: 'none', fontSize: '0.95rem', color: 'var(--gray)', background: 'transparent', cursor: 'not-allowed' }}
                    />
                  </div>

                  {/* SMS alerts activation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#8b5cf6' }}>Send report to mail</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={smsAlerts}
                        onChange={(e) => setSmsAlerts(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: smsAlerts ? '#8b5cf6' : '#cbd5e1',
                          transition: '0.3s',
                          borderRadius: '24px'
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            height: '18px', width: '18px',
                            left: '3px', bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%',
                            transform: smsAlerts ? 'translateX(20px)' : 'none'
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  {/* Save button and Logout side-by-side */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      style={{
                        flex: 2,
                        padding: '0.8rem',
                        borderRadius: '100px',
                        border: '1px solid #8b5cf6',
                        background: 'transparent',
                        color: '#8b5cf6',
                        fontWeight: '700',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        // boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        height: '45px'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#8b5cf6';
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#8b5cf6';
                        e.target.style.color = '#fff';
                      }}
                    >
                      {isSavingProfile ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      type="button"
                      className="btn-back"
                      onClick={onLogout}
                      style={{ flex: 1.2, justifyContent: 'center', margin: 0, padding: '0.75rem', borderRadius: '100px', border: '1.5px solid var(--border-color)', background: 'transparent', color: 'var(--gray)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', height: '45px', fontSize: '0.9rem' }}
                      onMouseEnter={(e) => {
                        e.target.style.color = '#8b5cf6';
                        e.target.style.border = '1px solid #8b5cf6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = 'var(--gray)';
                        e.target.style.border = '1.5px solid var(--border-color)';
                      }}
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          {/* Edit Link Modal */}
          {editingUrl && (
            <div className="edit-modal-overlay" onClick={() => setEditingUrl(null)}>
              <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                  <h3><Pencil size={18} style={{ color: 'var(--purple)' }} /> Edit Link</h3>
                  <button className="edit-modal-close" onClick={() => setEditingUrl(null)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="edit-modal-body">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Link title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Destination URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={editLongUrl}
                      onChange={(e) => setEditLongUrl(e.target.value)}
                      placeholder="https://example.com/..."
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                      Expiration
                    </label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                    />
                    {editExpiresAt && (
                      <button
                        type="button"
                        onClick={() => setEditExpiresAt('')}
                        style={{ fontSize: '0.75rem', color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.3rem', padding: 0, fontWeight: 600 }}
                      >
                        ✕ Remove expiration (make permanent)
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <Shield size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        className="form-input"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder={editingUrl?.password ? 'Enter new password to change, or leave blank to keep' : 'Set a password to protect this link'}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button type="button" onClick={() => setShowEditPassword(p => !p)}
                        style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 0 }}>
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {editingUrl?.password && (
                      <button type="button" onClick={() => setEditPassword('')}
                        style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.3rem', padding: 0, fontWeight: 600 }}>
                        Remove password protection (type nothing and save)
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label><Power size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Link Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
                      <button
                        type="button"
                        onClick={() => setEditIsActive(a => !a)}
                        className={`toggle-switch ${editIsActive ? 'toggle-switch--on' : ''}`}
                        aria-label="Toggle link active state"
                      >
                        <span className="toggle-thumb" />
                      </button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: editIsActive ? '#10b981' : '#94a3b8' }}>
                        {editIsActive ? 'Enabled — link is active' : 'Disabled — link is paused'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="edit-modal-footer">
                  <button
                    className="btn-purple-secondary"
                    onClick={() => setEditingUrl(null)}
                    style={{ padding: '0.6rem 1.5rem', borderRadius: '10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-purple"
                    onClick={handleUpdateUrl}
                    disabled={isSavingEdit}
                    style={{ padding: '0.6rem 1.5rem', borderRadius: '10px' }}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
    </DashboardLayout>
  );
}
