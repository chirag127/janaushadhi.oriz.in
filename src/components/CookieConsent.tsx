---
// src/components/CookieConsent.tsx
// Cookie consent banner (React island)

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <div className="cookie-text">
          <strong>Cookie Notice</strong>
          <p>We use cookies to enhance your experience, analyze traffic, and serve personalized content. By clicking "Accept All", you consent to our use of cookies.</p>
        </div>
        <div className="cookie-actions">
          <button className="btn btn-secondary" onClick={acceptEssential}>
            Essential Only
          </button>
          <button className="btn btn-primary" onClick={acceptAll}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
