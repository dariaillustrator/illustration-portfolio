import React from 'react';
import PageTransition from '../components/PageTransition';
import Contact from '../components/Contact';

export default function ContactPage() {
  return (
    <PageTransition>
      <div style={{ padding: '6rem 0' }}>
        <Contact />
      </div>
    </PageTransition>
  );
}
