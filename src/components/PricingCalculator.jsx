import React, { useState } from 'react';
import FadeIn from './FadeIn';

export default function PricingCalculator() {
  const [usage, setUsage] = useState(1);
  const [complexity, setComplexity] = useState(300);
  const [background, setBackground] = useState(0);

  const total = (complexity + background) * usage;

  return (
    <FadeIn id="pricing">
      <h2 className="section-headline">Transparency in Craft.</h2>
      <p className="section-copy">
        Get an immediate estimate for your project. Professional rights and high-resolution delivery included in all tiers.
      </p>
      
      <div className="calc-container">
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Usage Rights</label>
        <select className="form-select" value={usage} onChange={e => setUsage(Number(e.target.value))}>
          <option value={1}>Personal Use</option>
          <option value={1.5}>Commercial Use</option>
          <option value={3}>Full Buyout</option>
        </select>

        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Complexity</label>
        <select className="form-select" value={complexity} onChange={e => setComplexity(Number(e.target.value))}>
          <option value={150}>Sketch / Line Art</option>
          <option value={300}>Flat Color</option>
          <option value={600}>Full Render</option>
        </select>

        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Background Detail</label>
        <select className="form-select" value={background} onChange={e => setBackground(Number(e.target.value))}>
          <option value={0}>None / Transparent</option>
          <option value={100}>Simple / Abstract</option>
          <option value={350}>Detailed Environment</option>
        </select>

        <div className="calc-total">
          Estimated Investment: ${total.toLocaleString()}
        </div>
      </div>
    </FadeIn>
  );
}
