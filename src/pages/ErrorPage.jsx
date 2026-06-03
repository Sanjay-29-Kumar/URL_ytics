import errorSvg from '../assets/error.svg';

const ERROR_CONFIGS = {
  link_disabled: {
    title: 'Link is Disabled',
    subtitle: 'This short link has been temporarily disabled by its owner.',
    detail: 'The link you followed is currently paused. Please contact the link owner to reactivate it.',
    color: '#8b5cf6',
    badge: 'Disabled',
    badgeBg: 'rgba(139,92,246,0.1)',
  },
  link_expired: {
    title: 'Link Has Expired',
    subtitle: 'This short link is no longer active.',
    detail: 'The link you followed had an expiration date and is no longer redirecting. Please request a new link from the sender.',
    color: '#f59e0b',
    badge: 'Expired',
    badgeBg: 'rgba(245,158,11,0.1)',
  },
  not_found: {
    title: 'Link Not Found',
    subtitle: 'We couldn\'t find the short link you\'re looking for.',
    detail: 'This short URL does not exist in our system. It may have been deleted or you may have mistyped the address.',
    color: '#ef4444',
    badge: '404',
    badgeBg: 'rgba(239,68,68,0.1)',
  },
  server_error: {
    title: 'Something Went Wrong',
    subtitle: 'We encountered an unexpected error.',
    detail: 'Our servers ran into an issue while processing your request. Please try again in a moment.',
    color: '#ef4444',
    badge: 'Error',
    badgeBg: 'rgba(239,68,68,0.1)',
  },
};

export default function ErrorPage({ errorType, onGoHome }) {
  const config = ERROR_CONFIGS[errorType] || ERROR_CONFIGS['not_found'];

  return (
    <div className="error-page-container">
      {/* Decorative bg blobs */}
      <div className="error-blob error-blob--1" />
      <div className="error-blob error-blob--2" />

      <div className="error-card">
        {/* Error image */}
        <div className="error-image-wrap">
          <img src={errorSvg} alt="Error illustration" className="error-image" />
        </div>

        {/* Badge */}
        {/* <span
          className="error-badge"
          style={{ background: config.badgeBg, color: config.color, border: `1px solid ${config.color}22` }}
        >
          {config.badge}
        </span> */}

        {/* Text */}
        <h1 className="error-title" style={{ color: config.color }}>{config.title}</h1>
        <p className="error-subtitle">{config.subtitle}</p>
        {/* <p className="error-detail">{config.detail}</p> */}

        {/* Actions
        <div className="error-actions">
          <button className="btn-purple" onClick={onGoHome} style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontSize: '1rem' }}>
            ← Go to URLytics Home
          </button>
        </div> */}
      </div>
    </div>
  );
}
