import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'table';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', variant = 'default', ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={`
        border border-navy-900/20 text-sm 
        focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 
        ${variant === 'table' ? 'px-2 py-1 rounded' : 'px-3 py-2 rounded-lg mt-1'} ${className}`}
      {...props}
    />
  )
});