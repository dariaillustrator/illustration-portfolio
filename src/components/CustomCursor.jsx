import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveringGallery, setHoveringGallery] = useState(false);

  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check if it's a touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    let frameId;
    const move = (e) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      });
    };
    
    const handleMouseOver = (e) => {
      // Show glass circle ONLY when hovering over an illustration (gallery-card)
      if (e.target.closest('.gallery-card')) {
        setHoveringGallery(true);
      } else {
        setHoveringGallery(false);
      }
    };
    
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', handleMouseOver);
    
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(frameId);
    };
  }, []);

  if (isTouch) return null;

  // Respect reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      className="custom-cursor"
      style={{
        position: 'fixed', top: 0, left: 0,
        x: position.x - 10, y: position.y - 10,
        pointerEvents: 'none', zIndex: 9999,
        width: '20px', height: '20px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: hoveringGallery ? 1 : 0, scale: hoveringGallery ? 2 : 0.5 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
    />
  );
}
