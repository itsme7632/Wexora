import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Scrolls to the top of the page whenever the route changes.
 * Uses wouter's useLocation hook to detect navigation.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
    // Also scroll any scrollable container to top
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);

  return null;
}
