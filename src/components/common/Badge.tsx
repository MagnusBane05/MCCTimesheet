import { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-accent-500/10 text-accent-600 border border-accent-200',
  secondary: 'bg-navy-800/10 text-navy-950 border border-navy-700/20',
  success: 'bg-success-50 text-success-700 border border-success-200',
  warning: 'bg-warning-50 text-warning-700 border border-warning-200',
  info: 'bg-info-50 text-info-700 border border-info-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
};

export function Badge({ variant = 'secondary', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
