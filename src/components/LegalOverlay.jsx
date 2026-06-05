import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Shield } from 'lucide-react';
import { useUI } from '../context/UIContext';

export default function LegalOverlay() {
  const { legalType, closeLegal } = useUI();

  useEffect(() => {
    if (!legalType) return;

    // Body scroll lock
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLegal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [legalType, closeLegal]);

  const isOpen = legalType !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem',
          pointerEvents: 'none'
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLegal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              pointerEvents: 'all'
            }}
          />

          {/* Island Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '85vh',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'all'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
          >
            {/* Header */}
            <div style={{ 
              padding: '1.5rem 2rem', 
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.05)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {legalType === 'terms' ? (
                  <FileText size={20} style={{ opacity: 0.6 }} />
                ) : (
                  <Shield size={20} style={{ opacity: 0.6 }} />
                )}
                <h2 id="legal-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  {legalType === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h2>
              </div>
              <button 
                onClick={closeLegal}
                aria-label="Close Legal Modal"
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ 
              padding: '2rem', 
              overflowY: 'auto',
              flex: 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {legalType === 'terms' ? (
                // Terms and Conditions Content
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem', lineHeight: 1.6, opacity: 0.85 }}>
                  <p style={{ fontStyle: 'italic', opacity: 0.7 }}>Last updated: June 2026</p>
                  
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>1. Scope & Application</h3>
                    <p>These Terms and Conditions govern the creative and illustration services provided by Daria ("Illustrator"). By commissioning artwork, paying a deposit, or accepting a quote, you ("Client") agree to be bound by these terms.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>2. Creative Commissions</h3>
                    <p>All projects are initiated based on a written brief and pricing quote. To secure a slot in the production schedule, a <strong>50% non-refundable deposit</strong> is required. Work begins only after the deposit has cleared. The remaining 50% balance is due immediately upon completion and approval of the artwork, before high-resolution files are delivered.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>3. Revision Policy</h3>
                    <p>Client satisfaction is central to my process. Every standard commission includes up to <strong>two (2) rounds of revisions</strong> during the sketch/draft phase. Revisions must be requested in writing. Any additional revisions, or requests for changes after final approval, will be charged separately at an hourly or per-illustration rate.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>4. Intellectual Property & Copyright</h3>
                    <p>All creative work, sketches, concepts, and final illustrations displayed on this website or produced for projects are the sole intellectual property of the Illustrator. Unless explicitly transferred in writing via a licensing agreement, all copyrights remain with the Illustrator. Client receives license rights specified in the project agreement upon receipt of final payment.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>5. Hosting & Platform</h3>
                    <p>This website is hosted on the Vercel platform. Access and availability of the digital portfolio are subject to Vercel's service conditions.</p>
                  </div>
                </div>
              ) : (
                // Privacy Policy Content
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem', lineHeight: 1.6, opacity: 0.85 }}>
                  <p style={{ fontStyle: 'italic', opacity: 0.7 }}>Last updated: June 2026</p>
                  
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>1. Data Collection</h3>
                    <p>We respect your privacy. We only collect basic contact information (such as name, email address, and phone number) when you voluntarily submit it to us via direct email inquiry or during booking discussions.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>2. Purpose of Processing</h3>
                    <p>Your personal data is used solely to respond to project inquiries, formulate custom pricing estimates, coordinate scheduling, and deliver commissioned artwork. We do not sell or share your data with third parties for marketing purposes.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>3. Storage & Security</h3>
                    <p>This website is securely hosted on Vercel. We utilize HTTPS encryption to protect data in transit. We do not process, collect, or store any sensitive payment information on our servers; any booking or invoicing transactions are handled externally via secure third-party platforms (like Stripe or PayPal).</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>4. Cookies</h3>
                    <p>Our website uses minimal technical cookies, primarily to store user interface preferences (such as your chosen light or dark theme) locally on your device. These cookies do not track your personal activities on other sites.</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>5. Your Rights (GDPR)</h3>
                    <p>Under the General Data Protection Regulation (GDPR), you have the right to request access to the personal data we hold about you, to correct any inaccuracies, or to ask for the complete deletion of your records. To exercise these rights, please contact us directly at <a href="mailto:dariaillustrates@gmail.com" style={{ fontWeight: 700, borderBottom: '1px solid currentColor' }}>dariaillustrates@gmail.com</a>.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
