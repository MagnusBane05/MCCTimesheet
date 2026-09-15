import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'inline';
  label?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { containerClassName = '', inputClassName = '', variant = 'default', label, className = '', ...props }, ref) {
  return (
    <div className={`${className} ${containerClassName}`}>
      {label && <label htmlFor={props.id} className="block text-sm font-medium text-navy-900">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>}
      <input 
        id={props.id} 
        ref={ref} 
        className={`
          border border-navy-900/20 text-sm 
          focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 
          ${variant === 'inline' ? 'px-2 py-1 text-sm rounded' : 'px-3 py-2 rounded-lg mt-1 w-56'} ${className} ${inputClassName}`} 
        {...props} 
      />
    </div>
  );
});