import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FadeIn from './FadeIn';

export default function PricingCalculatorPage() {
  const [usage, setUsage] = useState(1);
  const [complexity, setComplexity] = useState(300);
  const [background, setBackground] = useState(0);

  const total = (complexity + background) * usage;

  return (
    <div style={{ padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <FadeIn id="pricing-page" className="pricing-page-container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-headline" style={{ fontSize: '3rem' }}>Project Estimator</h2>
          <p className="section-copy" style={{ margin: '0 auto' }}>Calculate your investment instantly.</p>
        </div>
        
        <motion.div 
          className="floating-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.8 }}
        >
          <div className="calc-group">
            <label className="calc-label">Usage Rights</label>
            <select className="form-select" value={usage} onChange={e => setUsage(Number(e.target.value))}>
              <option value={1}>Personal Use</option>
              <option value={1.5}>Commercial Use</option>
              <option value={3}>Full Buyout</option>
            </select>
          </div>

          <div className="calc-group">
            <label className="calc-label">Complexity</label>
            <select className="form-select" value={complexity} onChange={e => setComplexity(Number(e.target.value))}>
              <option value={200}>Sketch / Line Art</option>
              <option value={300}>Flat Color</option>
              <option value={600}>Full Render</option>
            </select>
          </div>

          <div className="calc-group">
            <label className="calc-label">Background Detail</label>
            <select className="form-select" value={background} onChange={e => setBackground(Number(e.target.value))}>
              <option value={0}>None / Transparent</option>
              <option value={100}>Simple / Abstract</option>
              <option value={350}>Detailed Environment</option>
            </select>
          </div>

          <div className="calc-total-box">
            <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Estimated Investment</div>
            <div className="calc-total-price">${total.toLocaleString()}</div>
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
}
