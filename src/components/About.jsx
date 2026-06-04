import React from 'react';
import FadeIn from './FadeIn';

export default function About() {
  return (
    <FadeIn id="about">
      <h2 className="section-headline">Behind the Lens of the Pen.</h2>
      <div className="section-copy" style={{ maxWidth: '800px' }}>
        <p style={{ marginBottom: '1.5rem', fontSize: '1.5rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
          "I believe every line should serve the story. My work is a bridge between classic draftsmanship and modern digital techniques, focused on the intersection of grand world-building and intimate character moments."
        </p>
        <p>
          Based in Los Angeles, exploring the boundaries of visual narrative for over a decade.
        </p>
      </div>
    </FadeIn>
  );
}
