import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // If the intent is to scroll to the gallery, don't scroll to top.
    if (location.state?.scrollToGallery) return;
    
    // When the path changes, scroll to the top of the page immediately.
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
