import React from 'react';
import FadeIn from './FadeIn';

export default function ClientsRoll() {
  return (
    <FadeIn id="clients-roll" className="clients-section">
      <div className="logos-ribbon" style={{ marginTop: '0', marginBottom: '4rem' }}>
        <span>WIRED</span>
        <span>TOR BOOKS</span>
        <span>PENGUIN</span>
        <span>NETFLIX</span>
        <span>WIZARDS OF THE COAST</span>
      </div>
    </FadeIn>
  );
}
