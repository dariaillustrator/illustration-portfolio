import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Image as ImageIcon, Music, Newspaper, 
  Layers, Palette, Mail 
} from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const services = [
  { icon: <BookOpen size={18} />, title: 'Book Covers', desc: 'Custom cover illustrations for fiction and non-fiction.' },
  { icon: <ImageIcon size={18} />, title: 'Posters', desc: 'High-impact visual narratives for events and decor.' },
  { icon: <Music size={18} />, title: 'Album & Music', desc: 'Capturing the essence of sound through visual art.' },
  { icon: <Newspaper size={18} />, title: 'Editorial', desc: 'Storytelling for digital and print media.' },
  { icon: <Layers size={18} />, title: 'Full Book', desc: 'Complete visual world-building for authors.' },
  { icon: <Palette size={18} />, title: 'Ads & Fashion', desc: 'Artistic collaborations for brands and editorial shoots.' },
  { icon: <Mail size={18} />, title: 'Postcards', desc: 'Tactile miniatures for correspondence and keepsakes.' },
];

export default function Services() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <section id="services" style={{ padding: '8rem 2rem', background: 'var(--bg-primary)', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <ScrollReveal>
          <div style={{ marginBottom: '4rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Services</h3>
          </div>
        </ScrollReveal>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: '2rem' 
        }}>
          {services.map((service, index) => (
            <ScrollReveal key={index} delay={index * 0.05}>
              <motion.div 
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '1.5rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid transparent',
                  transition: 'border-color 0.3s ease'
                }}
                whileHover={{ borderColor: 'var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ color: 'var(--text-primary)', opacity: 0.8 }}>
                    {service.icon}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{service.title}</h4>
                </div>

                <motion.div
                  initial={false}
                  animate={{ 
                    height: hoveredIdx === index ? 'auto' : 0,
                    opacity: hoveredIdx === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    paddingTop: '0.5rem'
                  }}>
                    {service.desc}
                  </p>
                </motion.div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
