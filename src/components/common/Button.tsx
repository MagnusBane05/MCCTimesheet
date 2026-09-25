import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'inline';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'rounded-lg px-4 py-2.5 bg-cedar-500 text-white hover:bg-pine-400 focus-visible:outline-cedar-500',
  secondary: 'rounded-lg px-4 py-2.5 bg-white text-lakehouse-900 border border-lakehouse-900/20 hover:bg-birch-50 focus-visible:outline-lake-800',
  danger: 'rounded-lg px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-800',
  ghost: 'rounded-lg px-4 py-2.5 bg-transparent text-lakehouse-900 hover:bg-lakehouse-900/5 focus-visible:outline-lake-800',
  inline: 'rounded-full bg-white text-lakehouse-900 border border-lakehouse-900/20 hover:bg-birch-50 focus-visible:outline-lake-800'
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
      className={`inline-flex items-center justify-center gap-2 text-sm font-semibold 
        transition-colors 
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
