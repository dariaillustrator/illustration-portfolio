import React from 'react';
import FadeIn from './FadeIn';

export default function Contact() {
  return (
    <FadeIn id="contact">
      <h2 className="section-headline">Let’s Build Something.</h2>
      <p className="section-copy">
        Currently booking for Q3 2026. Fill out the brief below to start the conversation.
      </p>
      
      <form style={{ maxWidth: '800px' }} onSubmit={e => e.preventDefault()}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input type="text" placeholder="Full Name" className="form-input" required />
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <input type="email" placeholder="Email Address" className="form-input" required />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <select className="form-select" required>
              <option value="">Project Type</option>
              <option value="editorial">Editorial Illustration</option>
              <option value="concept">Concept Art</option>
              <option value="personal">Personal Commission</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <input type="text" placeholder="Timeline / Deadline" className="form-input" required />
          </div>
        </div>

        <textarea placeholder="The Vision (Tell me about the story you want to tell)" className="form-textarea" required></textarea>
        
        <button type="submit" className="btn-primary">Submit Brief</button>
      </form>
    </FadeIn>
  );
}
