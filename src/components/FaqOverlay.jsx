import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import { useUI } from '../context/UIContext';

export default function FaqOverlay() {
  const { isFaqOpen, closeFaq } = useUI();
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  React.useEffect(() => {
    if (!isFaqOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFaq();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>FAQ & STUDIO POLICIES</h2>
              </div>
              <button 
                onClick={closeFaq}
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
                <div 
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ 
                    marginBottom: '0.8rem', 
                    padding: '1.2rem',
                    background: hoveredIdx === i ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    border: '1px solid',
                    borderColor: hoveredIdx === i ? 'var(--glass-border)' : 'transparent'
                  }}
                >
                  <h3 style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 800, 
                    marginBottom: hoveredIdx === i ? '0.8rem' : 0, 
                    opacity: hoveredIdx === i ? 1 : 0.7,
                    transition: 'all 0.3s ease'
                  }}>
                    {faq.q}
                  </h3>
                  
                  <motion.div
                    initial={false}
                    animate={{ 
                      height: hoveredIdx === i ? 'auto' : 0,
                      opacity: hoveredIdx === i ? 1 : 0
                    }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.6, margin: 0 }}>
                      {faq.a}
                    </p>
                  </motion.div>
                </div>
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
                  href="mailto:daria.illustrates@gmail.com" 
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
