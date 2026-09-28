import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};
  return (
    <div className={`animate-fade-in ${className}`} style={delayStyle}>
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};
  return (
    <div className={`animate-fade-in ${className}`} style={delayStyle}>
      {children}
    </div>
  );
}

export function SlideIn({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};
  return (
    <div className={`animate-slide-in ${className}`} style={delayStyle}>
      {children}
    </div>
  );
}

export function ScaleIn({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};
  return (
    <div className={`animate-scale-in ${className}`} style={delayStyle}>
      {children}
    </div>
  );
}
