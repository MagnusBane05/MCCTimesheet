export function Logo({ className = '', variant = 'primary' }: { className?: string, variant?: 'primary' | 'secondary' }) {
  return (
    <img
      src={variant === 'primary' ? '/mcc-logo-primary-light.svg' : '/mcc-logo-secondary-colour.svg'}
      alt="Muskoka Custom Carpentry"
      className={`h-8 w-auto ${className}`}
    />
  );
}
