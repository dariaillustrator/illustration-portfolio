import React from 'react';
import { Link } from 'react-router-dom';
import FadeIn from './FadeIn';

export default function PricingSectionHome() {
  return (
    <FadeIn id="pricing-home">
      <h2 className="section-headline">Transparency in Craft.</h2>
      <p className="section-copy">
        Get an immediate estimate for your project. Professional rights and high-resolution delivery included in all tiers.
      </p>
      <Link to="/pricing" className="btn-primary">
        View Pricing Calculator
      </Link>
    </FadeIn>
  );
}
