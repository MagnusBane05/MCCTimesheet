export function Logo({ className = '', variant = 'primary' }: { className?: string, variant?: 'primary' | 'secondary' }) {
  return (
    <img
      src={variant === 'primary' ? '/mcc-logo-primary.png' : '/mcc-logo-secondary.png'}
      alt="Muskoka Custom Carpentry"
      className={`h-8 w-auto ${className}`}
    />
  );
}
