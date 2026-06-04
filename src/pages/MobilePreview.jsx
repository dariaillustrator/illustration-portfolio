import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, RefreshCw, Smartphone, Monitor, Info, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRESETS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 13 / 14', width: 375, height: 812 },
  { name: 'Google Pixel 7', width: 412, height: 892 },
];

export default function MobilePreview() {
  const [device, setDevice] = useState(PRESETS[1]); // Default to iPhone 13/14
  const [isLandscape, setIsLandscape] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeUrl, setIframeUrl] = useState('/');
  const iframeRef = useRef(null);

  const activeWidth = isLandscape ? device.height : device.width;
  const activeHeight = isLandscape ? device.width : device.height;

  const reloadIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  const setPageUrl = (url) => {
    setIframeUrl(url);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#0a0a0c',
      color: '#fdfdfc',
      fontFamily: 'system-ui, sans-serif',
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      zIndex: 99999,
      overflow: 'hidden'
    }}>
      {/* Sidebar Controls */}
      <div style={{
        background: '#121215',
        borderRight: '1px solid #27272a',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto'
      }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              color: '#fdfdfc',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>DEVICE SIMULATOR</h1>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Preview mobile layouts</span>
            </div>
          </div>

          {/* Preset Selector */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>Select Device</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PRESETS.map((p) => {
                const isSelected = p.name === device.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => setDevice(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--text-primary)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? 'var(--bg-primary)' : '#fdfdfc',
                      border: '1px solid',
                      borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.05)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Smartphone size={16} style={{ opacity: isSelected ? 1 : 0.6 }} />
                    <div style={{ flex: 1 }}>
                      <div>{p.name}</div>
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{p.width} × {p.height}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientation and Reload Controls */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>Simulator Controls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#fdfdfc',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
              >
                <RotateCw size={14} />
                Rotate
              </button>
              <button
                onClick={reloadIframe}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#fdfdfc',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
              >
                <RefreshCw size={14} />
                Reload
              </button>
            </div>
          </div>

          {/* Quick Page Links */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>Quick Page Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { name: 'Gallery (Home)', path: '/' },
                { name: 'About', path: '/about' },
                { name: 'Pricing', path: '/pricing' }
              ].map((p) => {
                const isActive = iframeUrl === p.path;
                return (
                  <button
                    key={p.path}
                    onClick={() => setPageUrl(p.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      color: '#fdfdfc',
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{p.name}</span>
                    <ArrowUpRight size={14} style={{ opacity: 0.4 }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.03)',
          display: 'flex',
          gap: '0.8rem'
        }}>
          <Info size={16} style={{ flexShrink: 0, opacity: 0.4, marginTop: '2px' }} />
          <p style={{ fontSize: '0.7rem', opacity: 0.5, lineHeight: 1.4, margin: 0 }}>
            Interact directly inside the device frame. Scroll, hover, click, and navigate the simulated layout as if on a real touchscreen.
          </p>
        </div>
      </div>

      {/* Simulator Workspace Area */}
      <div style={{
        background: '#0d0d0f',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Dimensions Tag */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '0.4rem 1rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <span>{device.name}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>{activeWidth} × {activeHeight} px</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ color: 'var(--accent)' }}>{isLandscape ? 'Landscape' : 'Portrait'}</span>
        </div>

        {/* Mock Phone Container Frame */}
        <motion.div
          animate={{ width: activeWidth + 24, height: activeHeight + 24 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            background: '#27272a',
            border: '12px solid #27272a',
            borderRadius: '40px',
            boxShadow: '0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'stretch'
          }}
        >
          {/* Notch (only in portrait mode) */}
          {!isLandscape && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '22px',
              background: '#27272a',
              borderBottomLeftRadius: '14px',
              borderBottomRightRadius: '14px',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              {/* Speaker Bar */}
              <div style={{ width: '35px', height: '3px', background: '#3f3f46', borderRadius: '2px' }} />
              {/* Camera Lens */}
              <div style={{ width: '6px', height: '6px', background: '#09090b', borderRadius: '50%' }} />
            </div>
          )}

          {/* Iframe content */}
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={iframeUrl}
            title="Mobile Site Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '28px',
              background: 'var(--bg-primary)',
              zIndex: 10
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
