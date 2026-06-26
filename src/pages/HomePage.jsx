import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import Services from '../components/Services';
import { ArrowUp, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToGallery) {
      setTimeout(() => {
        const gallery = document.getElementById('gallery');
        if (gallery) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [location]);

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
                marginBottom: '1.5rem'
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
            <style>{`
              /* Reduce top padding of the outer CTA block container */
              .home-cta-block {
                padding-top: 2.5rem !important;
                padding-bottom: 4rem !important;
              }

              .work-with-me-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                gap: 4rem;
                padding: 0 0 1rem 0;
              }

              .work-with-me-text {
                flex: 1.2;
                max-width: 600px;
                text-align: left;
              }

              .section-label {
                font-size: 1rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: var(--text-secondary);
                margin-bottom: 2rem;
                font-weight: 700;
              }

              .cta-headline {
                font-family: var(--font-editorial);
                font-size: 2.8rem;
                font-weight: normal;
                line-height: 1.1;
                margin-bottom: 1.5rem;
                color: var(--text-primary);
              }

              .cta-desc {
                color: var(--text-primary);
                margin-bottom: 3rem;
                line-height: 1.5;
                opacity: 0.8;
                font-size: 1.1rem;
                max-width: 550px;
              }

              .work-with-me-carousel-wrapper {
                flex: 1.5;
                width: 100%;
                max-width: 720px;
                overflow: hidden;
                position: relative;
              }

              .carousel-fade-mask {
                width: 100%;
                overflow: hidden;
                position: relative;
                mask-image: linear-gradient(to right, transparent 0%, #000 15%, #000 85%, transparent 100%);
                -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 15%, #000 85%, transparent 100%);
              }

              .carousel-track {
                display: flex;
                width: max-content;
                gap: 0.5rem;
                animation: infinite-scroll 25s linear infinite;
              }

              .carousel-slide {
                width: 200px;
                height: 250px;
                flex-shrink: 0;
                border-radius: 2px;
                overflow: hidden;
                border: 1px solid var(--border);
                background: rgba(120, 120, 120, 0.05);
              }

              .carousel-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              @keyframes infinite-scroll {
                from {
                  transform: translateX(0);
                }
                to {
                  transform: translateX(-50%);
                }
              }

              @media (max-width: 900px) {
                .work-with-me-container {
                  flex-direction: column;
                  gap: 3rem;
                  align-items: flex-start;
                }

                .work-with-me-text {
                  max-width: 100%;
                }

                .work-with-me-carousel-wrapper {
                  max-width: 100%;
                }
                
                .carousel-slide {
                  width: 140px;
                  height: 175px;
                }
              }
            `}</style>
            
            <div className="work-with-me-container">
              <div className="work-with-me-text">
                <h3 className="section-label">
                  Work with me
                </h3>
                <h2 className="cta-headline">
                  Art for your Space.
                </h2>
                <p className="cta-desc">
                  Bring unique prints and illustrations into your home. Discover our print shop collection in partnership with Skarb prints.
                </p>
                <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                  Shop Prints <ArrowRight size={20} />
                </Link>
              </div>

              <div className="work-with-me-carousel-wrapper">
                <div className="carousel-fade-mask">
                  <div className="carousel-track">
                    {[
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD01_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD03_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD05_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD06_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD08_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD11_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD13_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD01_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD03_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD05_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD06_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD08_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD11_INT.webp',
                      'https://pub-3303a2731bea4f92b60a57762526c7a6.r2.dev/shop/DD13_INT.webp'
                    ].map((mockup, idx) => (
                      <div key={idx} className="carousel-slide">
                        <img src={mockup} alt="Daria illustrations mockup" className="carousel-image" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PageTransition>
  );
}
