import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Check, Copy } from 'lucide-react';
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

export default function ContactOverlay() {
  const { isContactOpen, closeContact } = useUI();
  const [copied, setCopied] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    if (!isContactOpen) return;

    // Body scroll lock
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeContact();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isContactOpen, closeContact]);

  const copyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText('dariaillustrates@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contacts = [
    {
      icon: <Mail size={22} />,
      label: 'Email',
      value: 'dariaillustrates@gmail.com',
      action: { type: 'link', href: 'mailto:dariaillustrates@gmail.com' },
      isCopyable: true,
    },
    {
      icon: <Phone size={22} />,
      label: 'Phone',
      value: '+39 328 4232499',
      action: { type: 'link', href: 'tel:+393284232499' },
    },
    {
      icon: <InstagramIcon size={22} />,
      label: 'Instagram',
      value: '@d.daria_________',
      action: { type: 'tab', href: 'https://www.instagram.com/d.daria_________/' },
    },
    {
      icon: <ThreadsIcon size={22} />,
      label: 'Threads',
      value: '@d.daria_________',
      action: { type: 'tab', href: 'https://www.threads.com/@d.daria_________' },
    },
  ];

  return (
    <AnimatePresence>
      {isContactOpen && (
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
      padding: 'clamp(0.75rem, 4vw, 2rem)',
      pointerEvents: 'none'
    }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeContact}
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

      {/* Contact Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
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
        aria-labelledby="contact-title"
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem clamp(1rem, 4vw, 2rem)', 
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.05)',
          flexShrink: 0
        }}>
          <h2 id="contact-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>GET IN TOUCH</h2>
          <button 
            onClick={closeContact}
            aria-label="Close Contact Modal"
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

        {/* List Content */}
        <div style={{ 
          padding: 'clamp(1rem, 4vw, 2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {contacts.map((contact, i) => {
            const isLink = contact.action.type === 'link';
            const WrapperTag = isLink ? 'a' : 'div';
            const extraProps = isLink 
              ? { href: contact.action.href } 
              : (contact.action.type === 'tab' 
                ? { onClick: () => window.open(contact.action.href, '_blank', 'noopener,noreferrer'), style: { cursor: 'pointer' } } 
                : {});

            return (
              <motion.div
                key={contact.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.2rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: hoveredIdx === i ? 'var(--glass-border)' : 'transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <WrapperTag 
                  {...extraProps}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flex: 1,
                    minWidth: 0, // critical to allow flex children to shrink and prevent overflow
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    ...((!isLink && contact.action.type !== 'tab') ? {} : { cursor: 'pointer' })
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', opacity: 0.8, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {contact.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {contact.label}
                    </span>
                    <span style={{ 
                      fontSize: 'clamp(0.85rem, 3.8vw, 1.05rem)', 
                      fontWeight: 500,
                      wordBreak: 'break-all',
                      lineHeight: '1.3'
                    }}>
                      {contact.value}
                    </span>
                  </div>
                </WrapperTag>

                {contact.isCopyable && (
                  <button
                    onClick={copyEmail}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      opacity: copied ? 0.9 : 0.4,
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      transition: 'opacity 0.2s, background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => {
                      if (!copied) e.currentTarget.style.opacity = 0.8;
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={e => {
                      if (!copied) e.currentTarget.style.opacity = 0.4;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Copy email to clipboard"
                  >
                    {copied ? <Check size={18} color="green" /> : <Copy size={18} />}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
