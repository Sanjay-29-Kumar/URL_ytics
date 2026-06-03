import { useState, useEffect } from 'react';
import { Link2, QrCode, BarChart3, Layers, Globe, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  // Monitor scrolling to toggle header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      {/* Glassmorphic Navigation Bar */}
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="#" className="logo">
            URL<span className="logo-accent">ytics</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <nav className="nav">
              <a href="#features">Features</a>
              <a href="#about">About</a>
            </nav>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button className="btn-signin" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button className="btn-primary" onClick={() => navigate('/signup')}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Shorten Links  <span className="shiny-text">Track Performance</span>
            </h1>
            <p className="hero-subtitle">
              Create clean, short links, manage them in customizable workspaces, and track real-time
              analytics like click counts, referrers, and device types to understand your audience.
            </p>

            <div className="cta-buttons" style={{ marginBottom: '1rem' }}>
                {/* <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem', marginTop: '1rem' }}>
                  Get Started for Free
                </button> */}
              {/* <a href="#features" className="btn-large btn-secondary">
                Explore Features
              </a> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <p className="section-subtitle">
            Everything you need to optimize your links, organize campaigns, and track your audience reach.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Link2 size={32} />
              </div>
              <h3>Branded Custom Links</h3>
              <p>Create clean, memorable custom back-halves to reflect your brand and boost click rates by up to 34%.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={32} />
              </div>
              <h3>Real-Time Analytics</h3>
              <p>Track click counts, referral channels, user geolocations, browsers, and device types instantly as they happen.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Layers size={32} />
              </div>
              <h3>Workspaces Organization</h3>
              <p>Group your links into separate workspaces for different client projects, social profiles, or team campaigns.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <QrCode size={32} />
              </div>
              <h3>Dynamic QR Codes</h3>
              <p>Automatically generate corresponding high-quality QR codes for marketing prints, packaging, and offline sharing.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Globe size={32} />
              </div>
              <h3>Referrer Tracking</h3>
              <p>Find out exactly where your traffic comes from - whether it's Twitter/X, LinkedIn, Google Search, or direct access.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Fast & Secure Redirection</h3>
              <p>Enjoy blazing-fast redirect times under 50ms with enterprise SSL security and built-in spam protection filters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Shorten URLs and track your performance in seconds</p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Paste Your Link</h3>
                <p>Input your long destination URL into our builder interface, select your workspace, and add a title.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Customize Alias</h3>
                <p>Generate a clean random short-link or write a custom URL back-half to make it memorable.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Share QR & Short URL</h3>
                <p>Distribute your link on social media posts, email newsletters, or print out the generated QR code.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Track Insights</h3>
                <p>Monitor your performance on our interactive dashboard with detailed charts and click histories.</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="cta-section" id="contact">
        <div className="cta-background-glow"></div>
        <div className="container">
          <h2>Ready to Supercharge Your Link Performance?</h2>
          {/* <p>Join thousands of marketers, content creators, and corporate brands who trust URLytics to deliver clean links and real-time statistics.</p> */}
          {/* <button className="btn-large btn-white" onClick={() => navigate('/signup')}>
            Get Started Free
          </button> */}
          <p className="cta-note">Free plan forever</p>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer" id="about">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <a href="#" className="footer-logo">
                URLytics
              </a>
              <p>
                Full-stack link management solution for marketing, campaigns, and analytics.
              </p>
            </div>

            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
            </div>

            {/* <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Blog</a>
              <a href="#">API docs</a>
              <a href="#">Uptime status</a>
            </div> */}

            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>

          <div className="footer-bottom">
            <a href='https://buildwithmk.app' style={{ textDecoration: 'none', color: '#e6d8d890' }}>buildwithmk.app</a>
            <div className="social-links">
              <a href="https://github.com/murali2277/urlytics" style={{ textDecoration: 'none', color: '#e6d8d890' }}>GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
