import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Info, MessageSquare } from 'lucide-react';
import { useUI } from '../context/UIContext';

export default function PricingPage() {
  const { openContact } = useUI();
  const [illustrations, setIllustrations] = useState(1);
  const [total, setTotal] = useState(200);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    setTotal(illustrations * 200);
  }, [illustrations]);

  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pricing-page" style={{ paddingTop: windowWidth < 768 ? '6rem' : '10rem', paddingBottom: windowWidth < 768 ? '6rem' : '10rem', maxWidth: '1200px', margin: '0 auto', paddingLeft: windowWidth < 768 ? '1.2rem' : '2rem', paddingRight: windowWidth < 768 ? '1.2rem' : '2rem' }}>
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: windowWidth < 768 ? '3rem' : '6rem' }}
      >
        <h1 className="pricing-title">Get your quote.</h1>
        <p style={{ fontSize: windowWidth < 768 ? '1.1rem' : '1.3rem', opacity: 0.6, maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
          Transparency is the foundation of a great collaboration. Use this interactive tool to get an immediate estimate for your custom illustrations, with upfront rates and no hidden surprises.
        </p>
      </motion.div>

      {/* Main Calculator Section */}
      <div className="pricing-grid">
        
        {/* Left Column: Calculator Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="floating-card"
          style={{ 
            background: 'var(--glass-bg)', 
            backdropFilter: 'blur(30px)',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.08)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: windowWidth < 768 ? '1.4rem' : '1.8rem', marginBottom: windowWidth < 768 ? '1.5rem' : '2.5rem' }}>Illustration Volume</h3>
            
            <div style={{ marginBottom: windowWidth < 768 ? '2rem' : '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontWeight: 700 }}>
                <span style={{ fontSize: '1.05rem' }}>Volume</span>
                <span style={{ color: 'var(--accent)', fontSize: '1.05rem' }}>{illustrations} {illustrations === 1 ? 'Illustration' : 'Illustrations'}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={illustrations} 
                onChange={(e) => setIllustrations(parseInt(e.target.value))}
                style={{ 
                  width: '100%', cursor: 'pointer', 
                  accentColor: 'var(--text-primary)',
                  height: '6px', borderRadius: '3px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', opacity: 0.4, fontSize: '0.9rem' }}>
                <span>1 Unit</span>
                <span>20+ Units</span>
              </div>
            </div>

            <div style={{ background: 'rgba(120,120,120,0.05)', padding: windowWidth < 768 ? '1rem' : '1.5rem', borderRadius: '8px', display: 'flex', gap: windowWidth < 768 ? '0.7rem' : '1rem', border: '1px solid rgba(120,120,120,0.1)' }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5 }}>
                <strong>Note:</strong> Rate is based on $200 per illustration. This interactive quote covers creation, digital delivery, and personal licensing. Bulk rates can be discussed for larger projects.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Result & Notices */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2rem' }}>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="pricing-result-card"
          >
            <div style={{ opacity: 0.6, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Estimated Investment</div>
            <div style={{ fontSize: windowWidth < 768 ? '3.2rem' : '4.5rem', marginBottom: windowWidth < 768 ? '1.5rem' : '2.5rem' }}>
              ${Math.round(total)}
            </div>
            
            <button 
              onClick={openContact}
              className="btn-primary"
              style={{ 
                background: 'var(--bg-primary)', color: 'var(--text-primary)', 
                width: '100%', padding: '1.5rem', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Get Final Quote <ArrowRight size={18} />
            </button>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '1.5rem', lineHeight: 1.5 }}>
              Price excludes specific commercial licenses and taxes where applicable.
            </p>
          </motion.div>

          {/* Excluded Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ 
              padding: '2.5rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.01)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Commercial & Scale Inquiries</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.6, lineHeight: 1.6 }}>
              For <strong>ADS</strong>, <strong>Fashion Campaigns</strong>, or large-scale book projects, please reach out directly for a personalized proposal tailored to your visibility goals.
            </p>
          </motion.div>
        </div>

      </div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ marginTop: windowWidth < 768 ? '5rem' : '10rem', textAlign: 'center', width: '100%' }}
      >
        <div className="paper-texture cta-box">
          <MessageSquare size={48} style={{ marginBottom: '2rem', opacity: 0.2 }} />
          <h2 className="cta-box-title">Ready to start your journey?</h2>
          <p style={{ fontSize: windowWidth < 768 ? '1.1rem' : '1.2rem', opacity: 0.6, maxWidth: '500px', marginBottom: windowWidth < 768 ? '2rem' : '3rem' }}>
            Every project is unique. Let's discuss your vision and finalize a quote that fits your specific needs.
          </p>
          <div className="cta-buttons">
            <button 
              onClick={openContact}
              className="btn-primary"
            >
              Get in touch
            </button>
            <a 
              href="https://calendly.com/daria-illustrates/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Book a Call
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
