import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HelpCircle, ArrowRight, BookOpen, Image as ImageIcon, 
  Newspaper, Layers, Palette, Sun, Moon
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [hoveredServiceIdx, setHoveredServiceIdx] = useState(null);
  const [showNavbar, setShowNavbar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const servicesMenuRef = useRef(null);
  const headerRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleFaq } = useUI();

  const services = [
    { title: "Book Illustration", icon: <BookOpen size={18} />, desc: "Professional visual storytelling for novels and educational projects. Bringing narrative worlds to life." },
    { title: "Ads & Fashion", icon: <Palette size={18} />, desc: "High-impact illustrations for global brand campaigns, fashion editorials, and luxury product packaging." },
    { title: "Posters", icon: <ImageIcon size={18} />, desc: "Poster designs for films, exclusive events, and premium interior decor." },
    { title: "Editorial", icon: <Newspaper size={18} />, desc: "Magazines, news outlets, and digital platforms. Translating concepts into art." },
    { title: "Covers & Merch", icon: <Layers size={18} />, desc: "Artwork for album covers and merchandise that resonates with audiences." }
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
    
    const determineTheme = () => {
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      
      // Combined OS preference & Time of Day synergy
      const systemDark = systemDarkMedia.matches;
      const hour = new Date().getHours();
      const isNightTime = (hour < 6 || hour >= 18);
      return systemDark || isNightTime;
    };
    
    const isDark = determineTheme();
    if (isDark) {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      setIsDarkMode(true);
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      setIsDarkMode(false);
    }
    
    // Dynamically react to OS theme changes if user has no saved preference
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const isNightTime = (hour < 6 || hour >= 18);
        const shouldBeDark = e.matches || isNightTime;
        if (shouldBeDark) {
          document.body.classList.remove('light-theme');
          document.body.classList.add('dark-theme');
          setIsDarkMode(true);
        } else {
          document.body.classList.remove('dark-theme');
          document.body.classList.add('light-theme');
          setIsDarkMode(false);
        }
      }
    };
    
    systemDarkMedia.addEventListener('change', handleSystemThemeChange);
    return () => systemDarkMedia.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    document.body.classList.add('theme-transitioning');
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
    // Remove transitioning class after animation completes
    setTimeout(() => document.body.classList.remove('theme-transitioning'), 500);
  };

  useEffect(() => {
    // Navbar visibility logic based on session intro
    const introPlayed = sessionStorage.getItem('daria_intro_played');
    if (introPlayed || location.pathname !== '/') {
      setShowNavbar(true);
    } else {
      // First visit on home: wait for hero to start typing
      const timer = setTimeout(() => setShowNavbar(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      if (window.scrollY > 50) setIsServicesOpen(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsLightboxOpen(document.body.classList.contains('lightbox-open'));
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleGalleryClick = (e) => {
    e.preventDefault();
    setIsServicesOpen(false);
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { skipIntroDelay: true, scrollToGallery: true } });
    } else {
      setTimeout(() => {
        const gallery = document.getElementById('gallery');
        if (gallery) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const isAdminPage = location.pathname === '/admin';

  if (isAdminPage) {
    return (
      <header 
        className="site-header"
        style={{ 
          opacity: 1,
          transform: 'translateX(-50%) translateY(0)',
          height: '52px',
          width: '700px',
          maxWidth: '95vw',
          background: 'var(--glass-bg)',
          backdropFilter: 'saturate(200%) blur(30px)',
          WebkitBackdropFilter: 'saturate(200%) blur(30px)',
          borderRadius: '8px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
          zIndex: 1000,
          position: 'fixed',
          top: '1.5rem',
          left: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all'
        }}
      >
        <span 
          style={{ 
            fontWeight: 500, 
            letterSpacing: '0.15em', 
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            color: 'var(--text-primary)'
          }}
        >
          AdminPortal
        </span>
      </header>
    );
  }

  return (
    <header 
      ref={headerRef}
      onMouseLeave={() => setIsServicesOpen(false)}
      className={`site-header ${scrolled ? 'header-scrolled' : ''} ${isServicesOpen ? 'header-expanded' : ''}`}
      style={{ 
        opacity: isLightboxOpen || !showNavbar ? 0 : 1, 
        transform: isLightboxOpen ? 'translateX(-50%) translateY(-20px)' : 'translateX(-50%) translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.3s ease, height 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: isLightboxOpen || !showNavbar ? 'none' : 'all',
        height: isMobileMenuOpen ? 'auto' : 
                (isServicesOpen ? (windowWidth < 768 ? '450px' : '155px') : 
                (scrolled ? '44px' : '52px')),
        width: isServicesOpen ? '1400px' : (scrolled ? (windowWidth < 1024 ? '95vw' : '700px') : '850px'),
        minHeight: isMobileMenuOpen ? '300px' : 'unset',
        maxWidth: '98vw',
        background: 'var(--glass-bg)',
        backdropFilter: 'saturate(200%) blur(30px)',
        WebkitBackdropFilter: 'saturate(200%) blur(30px)',
        borderRadius: windowWidth < 768 ? '0' : '8px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
        zIndex: 1000,
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}
    >
      <div className="header-top-row" style={{ 
        height: scrolled ? '44px' : '52px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between', 
        padding: '0 1.2rem',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: scrolled ? '0.8rem' : '1rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          {windowWidth < 1024 && (
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '18px' }}>
                <span style={{ width: '100%', height: '2px', background: 'currentColor', borderRadius: '2px', transform: isMobileMenuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none', transition: 'all 0.3s' }} />
                <span style={{ width: '100%', height: '2px', background: 'currentColor', borderRadius: '2px', opacity: isMobileMenuOpen ? 0 : 1, transition: 'all 0.3s' }} />
                <span style={{ width: '100%', height: '2px', background: 'currentColor', borderRadius: '2px', transform: isMobileMenuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none', transition: 'all 0.3s' }} />
              </div>
            </button>
          )}
          <Link to="/" className="header-logo-link" style={{ color: 'inherit', flexShrink: 0, textDecoration: 'none' }}>
            <span className="header-logo" style={{ fontWeight: 'normal', letterSpacing: '0.05em' }}>DARIA</span>
          </Link>
        </div>
        
        {windowWidth >= 1024 && (
          <nav className="header-nav" style={{ 
            color: 'inherit', 
            display: 'flex', 
            gap: scrolled ? '0.7rem' : '1.8rem', 
            alignItems: 'center',
            transition: 'gap 0.5s ease',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <a 
              href="/" 
              onClick={handleGalleryClick} 
              style={{ color: 'inherit', textDecoration: 'none' }}
              onMouseEnter={() => setIsServicesOpen(false)}
            >
              Gallery
            </a>

            <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={() => setIsServicesOpen(false)} onClick={() => setIsServicesOpen(false)}>Shop</Link>

            <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={() => setIsServicesOpen(false)} onClick={() => setIsServicesOpen(false)}>Pricing</Link>
            
            <button 
              onMouseEnter={() => setIsServicesOpen(true)}
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              onFocus={() => setIsServicesOpen(true)}
              aria-haspopup="true"
              aria-expanded={isServicesOpen}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'inherit', 
                cursor: 'pointer', 
                fontSize: 'inherit', 
                fontWeight: 'inherit',
                letterSpacing: 'inherit',
                padding: 0,
                margin: 0,
                fontFamily: 'inherit',
                lineHeight: 'inherit',
                verticalAlign: 'baseline',
                transition: 'all 0.3s ease',
              }}
            >
              Services
            </button>
            <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={() => setIsServicesOpen(false)} onClick={() => setIsServicesOpen(false)}>About</Link>
          </nav>
        )}

        <div className="header-icons" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="nav-icon-btn"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ 
              background: 'transparent', border: 'none', color: 'inherit', 
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              padding: 0, margin: 0, transition: 'all 0.3s ease',
              opacity: 0.8
            }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={toggleFaq}
            className="nav-icon-link" 
            aria-label="Frequently Asked Questions"
            onMouseEnter={() => setIsServicesOpen(false)} 
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }}
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && windowWidth < 1024 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ width: '100%', overflow: 'hidden', borderTop: '1px solid var(--glass-border)' }}
          >
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <a href="/" onClick={handleGalleryClick} style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.2rem', fontWeight: windowWidth < 768 ? 500 : 700 }}>Gallery</a>
              {windowWidth >= 768 && (
                <button 
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  aria-expanded={isServicesOpen}
                  aria-haspopup="true"
                  style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', color: 'inherit', textDecoration: 'none', fontSize: '1.2rem', fontWeight: windowWidth < 768 ? 500 : 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                >
                  Services <ArrowRight size={18} style={{ transform: isServicesOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
              )}
              <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.2rem', fontWeight: windowWidth < 768 ? 500 : 700 }}>Shop</Link>
              <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.2rem', fontWeight: windowWidth < 768 ? 500 : 700 }}>Pricing</Link>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); toggleFaq(); }}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', color: 'inherit', textDecoration: 'none', fontSize: '1.2rem', fontWeight: windowWidth < 768 ? 500 : 700, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                FAQ
              </button>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'inherit', textDecoration: 'none', fontSize: '1.2rem', fontWeight: windowWidth < 768 ? 500 : 700 }}>About</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services Dropdown Panel */}
      <AnimatePresence>
        {isServicesOpen && (
          <motion.div
            key="services-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
            style={{ 
              overflow: 'visible',
              background: 'transparent',
              backdropFilter: 'none',
              border: 'none',
              mixBlendMode: 'normal', 
              color: 'var(--text-primary)' 
            }}
          >
            <div 
              ref={servicesMenuRef}
              style={{ 
                padding: windowWidth < 768 ? '1rem' : '1.2rem 1.5rem 2rem',
                display: 'flex',
                flexDirection: windowWidth < 768 ? 'column' : 'row',
                justifyContent: 'center',
                gap: '0.8rem',
                width: '100%',
                maxWidth: '98vw',
                flexWrap: 'wrap',
                margin: '0 auto',
                overflow: 'visible'
              }}
            >
              {services.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => setHoveredServiceIdx(i)}
                  onMouseLeave={() => setHoveredServiceIdx(null)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: windowWidth < 768 ? '0.8rem 1.2rem' : '1.2rem',
                    display: 'flex',
                    flexDirection: windowWidth < 768 ? 'row' : 'column',
                    alignItems: windowWidth < 768 ? 'center' : 'stretch',
                    gap: windowWidth < 768 ? '1.2rem' : '0.4rem',
                    cursor: 'default',
                    transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    flex: '1',
                    minWidth: windowWidth < 768 ? '100%' : '0',
                    height: windowWidth < 768 ? '70px' : (hoveredServiceIdx === i ? 'auto' : '65px'),
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: hoveredServiceIdx === i ? 100 : 1,
                    boxShadow: hoveredServiceIdx === i ? '0 35px 70px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.08)',
                    transform: windowWidth < 768 ? 'none' : (hoveredServiceIdx === i ? 'translateY(25px) scale(1.05)' : 'translateY(0) scale(1)'),
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                    <div style={{ opacity: 0.8, color: 'inherit' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: windowWidth < 768 ? 500 : 700, letterSpacing: '0.01em', color: 'inherit' }}>{s.title}</div>
                  </div>
                  
                  {windowWidth >= 768 && (
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: hoveredServiceIdx === i ? 'auto' : 0,
                        opacity: hoveredServiceIdx === i ? 1 : 0,
                        marginTop: hoveredServiceIdx === i ? '0.6rem' : 0
                      }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div style={{ fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.7, fontWeight: 500, color: 'inherit' }}>
                        {s.desc}
                      </div>
                    </motion.div>
                  )}
                  
                  {windowWidth < 768 && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 500 }}>
                      {s.desc.substring(0, 60)}...
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
