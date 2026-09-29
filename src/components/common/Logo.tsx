export function Logo({ className = '', variant = 'primary' }: { className?: string, variant?: 'primary' | 'secondary' | 'tertiary' }) {
  return (
    <img
      src={variant === 'primary' ? '/mcc-logo-primary-light.svg' : variant === 'secondary' ? '/mcc-logo-secondary-colour.svg' : '/mcc-logo-tertiary-colour.svg'}
      alt="Muskoka Custom Carpentry"
      className={`h-8 w-auto ${className}`}
    />
  );
}
