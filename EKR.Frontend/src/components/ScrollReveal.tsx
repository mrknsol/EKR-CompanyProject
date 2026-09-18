import type { CSSProperties, ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

type RevealVariant = 'reveal' | 'reveal-left' | 'reveal-right' | 'reveal-scale';

type Props = {
  children: ReactNode;
  as?: keyof HTMLElementTagNameMap;
  variant?: RevealVariant;
  delay?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  className?: string;
  style?: CSSProperties;
};

export function ScrollReveal({
  children,
  as: Tag = 'div',
  variant = 'reveal',
  delay,
  className = '',
  style,
}: Props) {
  const { ref, className: revealClass } = useScrollReveal<HTMLElement>(variant);
  const delayClass = delay ? `delay-${delay}` : '';
  const combined = [revealClass, delayClass, className].filter(Boolean).join(' ');

  return (
    // @ts-expect-error dynamic tag ref typing
    <Tag ref={ref} className={combined} style={style}>
      {children}
    </Tag>
  );
}
