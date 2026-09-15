import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'inline' | 'large';
  label?: string;
  containerClassName?: string;
  selectClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', variant = 'default', label, containerClassName = '', selectClassName = '', ...props },
  ref
) {
  return (
    <div className={`${className} ${containerClassName}`}>
      {label && <label htmlFor={props.id} className="block text-sm font-medium text-navy-900">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>}
      <select
        ref={ref}
        className={`
          border border-navy-900/20
          focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 
          ${variant === 'inline' ? 'px-2 py-1 rounded text-sm ' : 
            variant === 'large' ? 'mt-1 rounded-lg px-3 py-2.5 text-base' : 
            'px-3 py-2 rounded-lg mt-1 text-sm '} ${className} ${selectClassName}`}
        {...props}
      />
    </div>
  )
});