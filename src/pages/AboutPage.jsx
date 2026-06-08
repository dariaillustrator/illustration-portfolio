import React from 'react';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUI } from '../context/UIContext';

export default function AboutPage() {
  const { openContact } = useUI();
  return (
    <PageTransition>
      <div className="about-page-container">

        {/* Invisible but crawlable semantic biography for AI engines */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "name": "About Daria Pavljenko — Illustrator",
          "url": "https://dariaillustrates.com/about",
          "mainEntity": {
            "@type": "Person",
            "@id": "https://dariaillustrates.com/#person",
            "name": "Daria Pavljenko",
            "description": "Daria Pavljenko is a professional illustrator and visual storyteller based in Rome, Italy. She discovered her passion for drawing as a child, inspired by her mother's sketches. Her first professional commissions were tarot card illustrations for a Ukrainian publishing house. She has since worked in publishing, advertising, and freelance projects for clients worldwide. Her style is surreal and atmospheric, blending illustration with collage using soft pastel palettes.",
            "jobTitle": "Illustrator",
            "worksFor": {
              "@type": "Organization",
              "name": "Daria Pavljenko Illustration Studio"
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Rome",
              "addressCountry": "IT"
            },
            "image": "https://dariaillustrates.com/images/daria-about.jpg",
            "email": "studio@daria.art",
            "knowsAbout": [
              "Editorial Illustration",
              "Book Cover Design",
              "Tarot Card Illustration",
              "Surreal Digital Collage",
              "Visual Storytelling",
              "Printmaking"
            ],
            "sameAs": [
              "https://www.instagram.com/d.daria_________/",
              "https://www.threads.com/@d.daria_________"
            ]
          }
        }) }} />

        {/* Main Info Section */}
        <div className="about-grid">
          <ScrollReveal style={{ flex: '1 1 400px' }}>
            <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--bg-secondary)', overflow: 'hidden', borderRadius: '8px' }}>
              <img
                src="/images/daria-about.jpg"
                alt="Daria Pavljenko, illustrator based in Rome, Italy — portrait photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: '8px' }}
                loading="eager"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal style={{ flex: '1.5 1 500px' }}>
            <article style={{ maxWidth: '600px' }}>
              <header>
                <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                  About Daria Pavljenko — Professional Illustrator
                </h1>
              </header>
              <p className="about-intro-text">
                Hi, I'm Daria — an illustrator who's been drawing since childhood, when I discovered my mother's old sketches and decided to follow her lead.
              </p>
              <p className="about-desc" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                My first commissions were tarot cards for a Ukrainian publishing house, and I've since worked across publishing, advertising, and freelance projects around the world. I'm especially drawn to book and editorial covers, visual storytelling that feels clear, intriguing, and just a little mysterious.
              </p>
              <p className="about-desc" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                My work leans surreal, often blending illustration with collage. Soft, pastel palettes help me create the atmosphere of a slightly faded dream.
              </p>
              <p className="about-desc" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                For collaborations or inquiries, feel free to reach out by <a href="mailto:studio@daria.art" style={{textDecoration: 'underline'}}>email</a>.<br/>
                Always happy to meet new ideas.
              </p>
            </article>
          </ScrollReveal>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center' }}
        >
          <div className="paper-texture cta-box">
            <MessageSquare size={48} style={{ marginBottom: '2rem', opacity: 0.2 }} />
            <h2 className="cta-box-title">Ready to start your journey?</h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.6, maxWidth: '500px', marginBottom: '3rem' }}>
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
              >
                Book a Call
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </PageTransition>
  );
}
