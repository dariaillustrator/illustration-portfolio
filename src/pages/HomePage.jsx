import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import Services from '../components/Services';
import { ArrowUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';
import { useUI } from '../context/UIContext';

function BottomGradient() {
  const [gradientOpacity, setGradientOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const gallery = document.getElementById('gallery');
      if (!gallery) return;

      const rect = gallery.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.top < windowHeight && rect.bottom > 0) {
        const fadeIn = rect.top <= 0 ? 1 : Math.max(0, 1 - (rect.top / 500));
        const fadeOut = Math.min(1, (rect.bottom - 200) / 400);
        setGradientOpacity(fadeIn * fadeOut);
      } else {
        setGradientOpacity(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="bottom-gradient"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '25vh',
        background: `linear-gradient(to top, 
          rgba(var(--bg-primary-rgb), 1) 0%, 
          rgba(var(--bg-primary-rgb), 0.9) 20%, 
          rgba(var(--bg-primary-rgb), 0.6) 45%, 
          rgba(var(--bg-primary-rgb), 0.3) 70%, 
          rgba(var(--bg-primary-rgb), 0.1) 85%, 
          transparent 100%)`,
        pointerEvents: 'none',
        zIndex: 15,
        opacity: gradientOpacity,
        transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    />
  );
}

export default function HomePage() {

  const scrollToGalleryStart = () => {
    const gallery = document.getElementById('gallery');
    if (gallery) {
      gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <PageTransition>
      <Hero />
      <Gallery />
      <BottomGradient />
      
      <section className="paper-texture home-cta-block" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <ScrollReveal>
            <button 
              onClick={scrollToGalleryStart} 
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: 'var(--text-secondary)',
                opacity: 0.3,
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '4rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = 0.8;
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = 0.3;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <ArrowUp size={20} />
            </button>
          </ScrollReveal>

          <ScrollReveal style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ maxWidth: '800px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 700 }}>
                  Work with me
                </h3>
                <h2 className="cta-headline" style={{ lineHeight: 1 }}>
                  Art for your projects.
                </h2>
                <p className="cta-desc" style={{ color: 'var(--text-primary)', marginBottom: '3rem', lineHeight: 1.4, maxWidth: '700px', opacity: 0.8 }}>
                  Bring unique illustrations into your creative projects. Contact me for custom quotes and commissioned artworks.
                </p>
                <Link to="/pricing" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                  Get a Quote <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PageTransition>
  );
}
