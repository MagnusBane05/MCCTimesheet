import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline-accent-700',
  secondary: 'bg-white text-navy-900 border border-navy-900/20 hover:bg-cream-100 focus-visible:outline-navy-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-800',
  ghost: 'bg-transparent text-navy-900 hover:bg-navy-900/5 focus-visible:outline-navy-700',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
