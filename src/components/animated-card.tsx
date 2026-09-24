import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className = "" }: AnimatedCardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function FadeIn({ children, className = "" }: AnimatedCardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function SlideIn({ children, className = "" }: AnimatedCardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function ScaleIn({ children, className = "" }: AnimatedCardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}