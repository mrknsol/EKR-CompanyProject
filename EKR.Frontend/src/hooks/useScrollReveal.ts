import { useEffect, useRef, useState } from 'react';

type RevealVariant = 'reveal' | 'reveal-left' | 'reveal-right' | 'reveal-scale';

export function useScrollReveal<T extends HTMLElement>(
  variant: RevealVariant = 'reveal',
  threshold = 0.12
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const className = [variant, visible && 'is-visible'].filter(Boolean).join(' ');

  return { ref, className, visible };
}
