import { forwardRef } from 'react';

export type SelectVariant = 'default' | 'inline' | 'large';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant;
  containerClassName?: string;
  selectClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', variant = 'default', containerClassName = '', selectClassName = '', ...props },
  ref
) {
  return (
    <div className={`${className} ${containerClassName}`}>
      <select
        ref={ref}
        className={`
          border border-lakehouse-900/20 bg-white disabled:bg-midnight-950/10
          focus:border-cedar-500 focus:outline-none focus:ring-1 focus:ring-cedar-500 
          cursor-pointer
          ${variant === 'inline' ? 'px-2 py-1 rounded text-sm ' : 
            variant === 'large' ? 'mt-1 rounded-lg px-3 py-2.5 text-base' : 
            'px-3 py-2 rounded-lg mt-1 text-sm '} ${className} ${selectClassName}`}
        {...props}
      />
    </div>
  )
});