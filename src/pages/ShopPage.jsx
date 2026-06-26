import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MessageSquare } from 'lucide-react';
import { useUI } from '../context/UIContext';
import SkarbLogo from '../components/SkarbLogo';


export default function ShopPage() {
  const { openContact } = useUI();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [hoveredItem, setHoveredItem] = useState(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 40, stiffness: 500, mass: 0.5 };
  const tooltipX = useSpring(mouseX, springConfig);
  const tooltipY = useSpring(mouseY, springConfig);

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

  const handleMouseEnter = (e, item) => {
    mouseX.set(e.clientX + 18);
    mouseY.set(e.clientY + 18);
    setHoveredItem(item);
  };

  useEffect(() => {
    const updateMouse = (e) => {
      mouseX.set(e.clientX + 18);
      mouseY.set(e.clientY + 18);
    };
    
    window.addEventListener('mousemove', updateMouse, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', updateMouse);
    };
  }, [mouseX, mouseY]);

  const shopItems = [
    { id: 'DD01', title: 'Balance', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD01.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD01_INT.webp', skarbUrl: 'https://skarbprints.com/products/balance?variant=56856936874308' },
    { id: 'DD03', title: 'Comet', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD03.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD03_INT.webp', skarbUrl: 'https://skarbprints.com/products/comet?variant=56856937267524' },
    { id: 'DD05', title: 'Dance', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD05.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD05_INT.webp', skarbUrl: 'https://skarbprints.com/products/dance?variant=56856937791812' },
    { id: 'DD06', title: 'Dream', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD06.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD06_INT.webp', skarbUrl: 'https://skarbprints.com/products/dream?variant=56856938840388' },
    { id: 'DD08', title: 'Fish', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD08.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD08_INT.webp', skarbUrl: 'https://skarbprints.com/products/fish?variant=56856939233604' },
    { id: 'DD11', title: 'Dive', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD11.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD11_INT.webp', skarbUrl: 'https://skarbprints.com/products/dive?variant=56856938316100' },
    { id: 'DD13', title: 'Fragility', src: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD13.webp', mockupSrc: 'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD13_INT.webp', skarbUrl: 'https://skarbprints.com/products/fragility?variant=56856939757892' }
  ];

  return (
    <div className="shop-page-wrapper">
      <style>{`
        .shop-page-wrapper {
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          min-height: 100vh;
          background: var(--bg-primary);
          transition: background 0.5s ease;
        }

        .shop-page-container {
          padding-top: ${windowWidth < 768 ? '6rem' : '10rem'};
          padding-bottom: ${windowWidth < 768 ? '6rem' : '10rem'};
          width: 100%;
          margin: 0 auto;
          padding-left: 4rem;
          padding-right: 4rem;
        }

        @media (max-width: 1024px) {
          .shop-page-container {
            padding-left: 3rem;
            padding-right: 3rem;
          }
        }

        @media (max-width: 768px) {
          .shop-page-container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }

        .shop-hero {
          text-align: center;
          margin-bottom: ${windowWidth < 768 ? '3rem' : '6rem'};
        }

        .shop-title {
          font-family: var(--font-editorial);
          font-size: ${windowWidth < 768 ? '3.2rem' : '5rem'};
          font-weight: normal;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        .shop-subheader {
          font-size: ${windowWidth < 768 ? '1.15rem' : '1.35rem'};
          opacity: 0.7;
          max-width: 650px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
          font-family: var(--font-main);
        }

        .skarb-badge-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          padding: 0.6rem 1.4rem;
          background: rgba(120, 120, 120, 0.05);
          border: 1px solid rgba(120, 120, 120, 0.15);
          border-radius: var(--radius-lg);
          margin-top: 0.5rem;
          text-decoration: none;
          color: var(--text-primary);
          transition: background 0.3s, border-color 0.3s, transform 0.2s;
          white-space: nowrap;
        }

        .skarb-badge-container:hover {
          background: rgba(120, 120, 120, 0.1);
          border-color: rgba(120, 120, 120, 0.25);
          transform: translateY(-1px);
        }

        .skarb-badge-container:active {
          transform: scale(0.98);
        }

        .skarb-collab-text {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          opacity: 0.85;
          font-weight: 600;
        }

        .skarb-badge-logo {
          height: 15px;
          width: auto;
        }

        .shop-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0px; /* Puzzle-style flush layout */
          margin-bottom: ${windowWidth < 768 ? '5rem' : '8rem'};
        }

        @media (max-width: 900px) {
          .shop-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .shop-grid {
            grid-template-columns: 1fr;
          }
        }

        .shop-card {
          background: transparent;
          border: none;
          border-radius: 0px;
          overflow: hidden;
          box-shadow: none;
          transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease, z-index 0.1s ease;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .shop-card:hover {
          transform: translateY(-5px);
          z-index: 2; /* Pull hovered item on top of adjacent items */
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .shop-card-image-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 125%; /* 4:5 Aspect Ratio for prints */
          overflow: hidden;
          background: rgba(120, 120, 120, 0.05);
          border-radius: 0px; /* square corners for puzzle fit */
        }

        .shop-card-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .shop-card:hover .shop-card-img {
          transform: scale(1.05);
          filter: blur(4px);
        }

        .shop-card-details {
          padding: 1.5rem 1rem;
          display: none; /* Hidden on desktop */
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          background: var(--bg-primary); /* details panel has same background to raise up with card translation */
          transition: background-color 0.5s ease;
        }

        @media (max-width: 768px) {
          .shop-card-details {
            display: flex;
          }
        }

        .shop-card-title {
          font-family: var(--font-main);
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--text-primary);
          text-align: center;
          margin: 0;
        }

        .shop-on-skarb-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          margin-top: 0.2rem;
          transition: transform 0.2s ease, opacity 0.2s ease;
          white-space: nowrap;
        }

        .shop-on-skarb-link:hover {
          opacity: 0.75;
          transform: translateY(-1px);
        }

        /* Hover Card Follower */
        .custom-hover-card {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
          pointer-events: none;
          max-width: 280px;
        }

        .hover-card-thumbnail {
          width: 50px;
          height: 62px;
          object-fit: cover;
          border-radius: 4px;
          background: rgba(120, 120, 120, 0.05);
        }

        .hover-card-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-right: 8px;
        }

        .hover-card-title {
          font-family: var(--font-main);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .hover-card-cta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .shop-on-skarb-link-logo {
          height: 13px;
          width: auto;
        }

        .shop-on-skarb-link-arrow {
          color: var(--text-secondary);
          opacity: 0.4;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .shop-on-skarb-link:hover .shop-on-skarb-link-arrow {
          transform: translate(2px, -2px);
          opacity: 0.9;
        }

        .shop-cta-tile {
          grid-column: span 2;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 100%;
          min-height: 380px;
          transition: background 0.3s ease;
        }

        @media (max-width: 900px) {
          .shop-cta-tile {
            grid-column: span 1;
            min-height: 300px;
          }
        }

        .custom-prints-cta-title {
          font-family: var(--font-editorial);
          font-size: ${windowWidth < 768 ? '1.8rem' : '2.4rem'};
          font-weight: normal;
          color: var(--text-primary);
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .custom-prints-cta-desc {
          font-size: 0.95rem;
          opacity: 0.6;
          max-width: 480px;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .custom-prints-cta-btn {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--text-primary);
          padding: 0.9rem 2.2rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .custom-prints-cta-btn:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
        }
      `}</style>

      <div className="shop-page-container">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="shop-hero"
        >
          <h1 className="shop-title">Art for your Space</h1>
          <p className="shop-subheader">
            We proudly collaborate with Skarb for our print shop.
          </p>
          <a 
            href="https://skarbprints.com/collections/daria-dubenko" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="skarb-badge-container"
          >
            <span className="skarb-collab-text">Shop on</span>
            <SkarbLogo className="skarb-badge-logo" style={{ height: '15px', display: 'inline-block' }} />
          </a>
        </motion.div>

        {/* Cards Grid */}
        <div className="shop-grid">
          {shopItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="shop-card"
            >
              <a 
                href={item.skarbUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="shop-card-image-wrapper">
                  <img src={item.mockupSrc} alt={`${item.title} interior mockup`} className="shop-card-img" />
                </div>
              </a>
              <div className="shop-card-details">
                <h3 className="shop-card-title">{item.title}</h3>
                <a 
                  href={item.skarbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shop-on-skarb-link"
                >
                  <SkarbLogo className="shop-on-skarb-link-logo" style={{ height: '13px', display: 'inline-block' }} />
                  <ArrowUpRight size={14} className="shop-on-skarb-link-arrow" />
                </a>
              </div>
            </motion.div>
          ))}

          {/* CTA Grid Tile */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="shop-cta-tile"
          >
            <MessageSquare size={windowWidth < 768 ? 32 : 40} style={{ marginBottom: '1.2rem', opacity: 0.25 }} />
            <h2 className="custom-prints-cta-title" style={{ fontSize: windowWidth < 768 ? '1.5rem' : '2rem', marginBottom: '0.8rem' }}>
              Looking for custom prints or commission?
            </h2>
            <p className="custom-prints-cta-desc" style={{ fontSize: '0.95rem', opacity: 0.6, maxWidth: '480px', marginBottom: '1.5rem' }}>
              Collaborate directly with Daria to create custom sized prints, specific commissions, or tailor-made illustration proposals.
            </p>
            <button 
              onClick={openContact}
              className="custom-prints-cta-btn"
            >
              Get in touch <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Floating Hover Card for Desktop */}
      {windowWidth > 768 && (
        <AnimatePresence>
          {hoveredItem && (
            <motion.div
              className="custom-hover-card"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                x: tooltipX,
                y: tooltipY,
                pointerEvents: 'none',
                zIndex: 9999,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
            >
              <img src={hoveredItem.src} alt={hoveredItem.title} className="hover-card-thumbnail" />
              <div className="hover-card-info">
                <span className="hover-card-title">{hoveredItem.title}</span>
                <div className="hover-card-cta">
                  <span>Shop on</span>
                  <SkarbLogo style={{ height: '11px' }} />
                  <ArrowUpRight size={12} style={{ opacity: 0.5 }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
