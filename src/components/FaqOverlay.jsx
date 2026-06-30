import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import { useUI } from '../context/UIContext';

export default function FaqOverlay() {
  const { isFaqOpen, closeFaq } = useUI();
  const [openIdx, setOpenIdx] = React.useState(null);

  const lastFocusedElement = React.useRef(null);

  React.useEffect(() => {
    if (!isFaqOpen) {
      if (lastFocusedElement.current) lastFocusedElement.current.focus();
      return;
    }

    lastFocusedElement.current = document.activeElement;
    setTimeout(() => {
      const closeBtn = document.querySelector('button[aria-label="Close FAQ"]');
      if (closeBtn) closeBtn.focus();
    }, 50);

    // Body scroll lock
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFaq();
      } else if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll('div[role="dialog"] button, div[role="dialog"] a, div[role="dialog"] [tabindex]:not([tabindex="-1"])');
        if (!focusableElements.length) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFaqOpen, closeFaq]);

  const faqs = [
    { q: "Commission process", a: "Once the brief is submitted, I provide a quote and schedule. A 50% deposit secures your slot." },
    { q: "Licensing & usage rights", a: "Standard pricing includes commercial rights." },
    { q: "Printing/shipping", a: "We're working on the prints shop. See you soon" },
    { q: "Revision policy", a: "Two rounds of revisions are included for each project. Additional revisions will be charged separately" },
    { q: "Delivery timelines", a: "Standard turnaround is 3-4 weeks. Rush delivery (1 week) is available at a 50% premium." }
  ];

  return (
    <AnimatePresence>
      {isFaqOpen && (
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
            onClick={closeFaq}
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
              maxWidth: '600px',
              maxHeight: '80vh',
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
            aria-labelledby="faq-title"
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
                <HelpCircle size={20} style={{ opacity: 0.6 }} />
                <h2 id="faq-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>FAQ & STUDIO POLICIES</h2>
              </div>
              <button 
                onClick={closeFaq}
                aria-label="Close FAQ"
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

            {/* Content Area with custom scrollbar behavior */}
            <div style={{ 
              padding: '1.5rem 2rem 2.5rem', 
              overflowY: 'auto',
              flex: 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {faqs.map((faq, i) => (
                <button 
                  key={i}
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  aria-expanded={openIdx === i}
                  style={{ 
                    marginBottom: '0.8rem', 
                    padding: '1.2rem',
                    background: openIdx === i ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: openIdx === i ? 'var(--glass-border)' : 'transparent',
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    color: 'inherit'
                  }}
                >
                  <h3 style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 800, 
                    marginBottom: openIdx === i ? '0.8rem' : 0, 
                    opacity: openIdx === i ? 1 : 0.7,
                    transition: 'all 0.3s ease'
                  }}>
                    {faq.q}
                  </h3>
                  
                  <motion.div
                    initial={false}
                    animate={{ 
                      height: openIdx === i ? 'auto' : 0,
                      opacity: openIdx === i ? 1 : 0
                    }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.6, margin: 0 }}>
                      {faq.a}
                    </p>
                  </motion.div>
                </button>
              ))}

              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1.5rem', 
                background: 'rgba(0,0,0,0.03)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.8rem' }}>Need more specific help?</p>
                <a 
                  href="mailto:dariaillustrates@gmail.com" 
                  style={{ 
                    color: 'var(--text-primary)', 
                    textDecoration: 'none', 
                    fontWeight: 700, 
                    fontSize: '0.9rem',
                    borderBottom: '1px solid currentColor'
                  }}
                >
                  Contact Studio Direct
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
