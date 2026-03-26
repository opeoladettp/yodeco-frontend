import React, { useState } from 'react';
import './PresentationGenerator.css';

const PresentationGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const generatePresentation = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');

      const res = await fetch(`${apiUrl}/presentation/download`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yodeco-awards-presentation.zip';
      a.click();
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', message: 'ZIP downloaded! Extract it and open index.html in your browser.' });
    } catch (err) {
      console.error('Presentation generation error:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to generate presentation. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="presentation-generator">
      <div className="presentation-generator__header">
        <div className="presentation-generator__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3>Awards Presentation</h3>
          <p>Generate a ZIP package with a standalone HTML slideshow, separate CSS &amp; JS, and all nominee images bundled locally.</p>
        </div>
      </div>

      <ul className="presentation-generator__features">
        <li>Category intro slides</li>
        <li>Award title slides</li>
        <li>Nominee showcase slides</li>
        <li>Winner / leading nominee reveal</li>
        <li>Images downloaded &amp; bundled</li>
        <li>Separate index.html, CSS &amp; JS</li>
        <li>Keyboard nav, auto-play, fullscreen</li>
      </ul>

      <button
        className="presentation-generator__btn"
        onClick={generatePresentation}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="presentation-generator__spinner" />
            Generating... (downloading images)
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15V3M12 15l-4-4M12 15l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Download Presentation ZIP
          </>
        )}
      </button>

      {status && (
        <div className={`presentation-generator__status presentation-generator__status--${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default PresentationGenerator;
