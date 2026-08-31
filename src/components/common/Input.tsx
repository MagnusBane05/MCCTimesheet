import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'inline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', variant = 'default', ...props }, ref) {
  return (
    <input 
      ref={ref} 
      className={`
        border border-navy-900/20 text-sm 
        focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 
        ${variant === 'inline' ? 'px-2 py-1 text-sm rounded' : 'px-3 py-2 rounded-lg mt-1 w-56'} ${className}`} 
      {...props} 
    />
  );
});