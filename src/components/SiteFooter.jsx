import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowUpRight } from 'lucide-react';
import { useUI } from '../context/UIContext';


const InstagramIcon = ({ size = 20, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const ThreadsIcon = ({ size = 20, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </svg>
);

export default function SiteFooter() {
  const { toggleFaq, openLegal } = useUI();
  const currentYear = new Date().getFullYear();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  const handleGalleryClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { skipIntroDelay: true, scrollToGallery: true } });
    } else {
      setTimeout(() => {
        const gallery = document.getElementById('gallery');
        if (gallery) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

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

  const isMobile = windowWidth < 768;

  const footerLinks = [
    { title: "Navigation", links: [
      { name: "Gallery", action: handleGalleryClick },
      { name: "Shop", path: "/shop" },
      ...(!isMobile ? [{ name: "Services", path: "/" }] : []),
      { name: "Pricing", path: "/pricing" },
      { name: "About", path: "/about" }
    ]},
    { title: "Legal & Support", links: [
      { name: "FAQ", action: toggleFaq },
      { name: "Terms of Service", action: () => openLegal('terms') },
      { name: "Privacy Policy", action: () => openLegal('privacy') }
    ]}
  ];

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2.5rem', fontWeight: 'normal', letterSpacing: '0.05em', lineHeight: 1 }}>
              DARIA
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6, marginBottom: '2rem' }}>
              Visual Storyteller & Printmaker. Supporting narrative worlds through art.
            </p>
            <div className="footer-socials" style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="mailto:dariaillustrates@gmail.com" className="footer-social-icon" aria-label="Send email" title="Email"><Mail size={20} /></a>
              <a href="https://www.instagram.com/d.daria_________/" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Visit Instagram profile" title="Instagram"><InstagramIcon size={20} /></a>
              <a href="https://www.threads.com/@d.daria_________" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Visit Threads profile" title="Threads"><ThreadsIcon size={20} /></a>
            </div>
          </div>

          {/* Links Sections */}
          {!isAdminPage && footerLinks.map((section, i) => (
            <div key={i}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', opacity: 0.4 }}>{section.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {section.links.map((link, j) => (
                  <li key={j}>
                    {link.path ? (
                      <Link to={link.path} className="footer-nav-link" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', transition: 'transform 0.2s' }}>
                        {link.name} <ArrowUpRight size={12} style={{ opacity: 0.3 }} />
                      </Link>
                    ) : (
                      <button 
                        onClick={link.action}
                        className="footer-nav-link"
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', transition: 'transform 0.2s' }}
                      >
                        {link.name} <ArrowUpRight size={12} style={{ opacity: 0.3 }} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            © {currentYear} Daria Illustrator. All rights reserved. 
          </p>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ opacity: 0.6 }}>Studio located in Rome, Italy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
