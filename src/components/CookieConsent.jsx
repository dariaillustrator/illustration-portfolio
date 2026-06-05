import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../context/UIContext';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { openLegal } = useUI();

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem('daria_cookie_consent');
    if (!consent) {
      // Show banner with a small delay for a premium feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('daria_cookie_consent', 'true');
    setIsVisible(false);
  };

    return (
      <AnimatePresence>
        {isVisible && (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 1rem',
            zIndex: 9000,
            pointerEvents: 'none'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                width: '100%',
                maxWidth: '600px',
                pointerEvents: 'auto',
                background: 'var(--glass-bg)',
                backdropFilter: 'saturate(180%) blur(30px)',
                WebkitBackdropFilter: 'saturate(180%) blur(30px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cookies &amp; Privacy
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  This website does not use tracking or marketing cookies. We only use strictly necessary cookies to ensure the website functions correctly. By continuing to browse, you agree to our{" "}
                  <button
                    onClick={() => openLegal('privacy')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-primary)',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit'
                    }}
                  >
                    Privacy Policy
                  </button>.
                </p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={handleAccept}
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)'
                  }}
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
}
