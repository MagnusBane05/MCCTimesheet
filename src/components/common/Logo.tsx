interface LogoProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
}

export function Logo({ className = '', variant = 'primary', size = 'medium' }: LogoProps) {
  return (
    <img
      src={variant === 'primary' ? '/mcc-logo-primary-light.svg' : variant === 'secondary' ? '/mcc-logo-secondary-colour.svg' : '/mcc-logo-tertiary-colour.svg'}
      alt="Muskoka Custom Carpentry"
      className={`h-${size === 'small' ? '4' : size === 'medium' ? '8' : '20'} w-auto ${className}`}
    />
  );
}
