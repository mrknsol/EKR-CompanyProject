import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'idle'>('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('enter');
      setDisplayLocation(location);
    }
  }, [location, displayLocation.pathname]);

  useEffect(() => {
    if (transitionStage === 'enter') {
      const id = window.requestAnimationFrame(() => setTransitionStage('idle'));
      return () => window.cancelAnimationFrame(id);
    }
  }, [transitionStage, displayLocation.pathname]);

  return (
    <div key={displayLocation.pathname} className="page-enter">
      {children}
    </div>
  );
}
