import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // When the path changes, scroll to the top of the page immediately.
    // However, if we navigated to the home page with the intent to scroll to the gallery, 
    // the SiteHeader's setTimeout will scroll down to it. So scrolling to top 
    // synchronously here is safe and doesn't override the subsequent scrollIntoView.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
