import { forwardRef } from "react";

type InputVariant = 'default' | 'inline';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'default', className = '', ...props }, ref) {
  return (
    <input 
      id={props.id} 
      ref={ref} 
      className={`
        border border-lakehouse-900/20 text-sm 
        focus:border-cedar-500 focus:outline-none focus:ring-1 focus:ring-cedar-500 
        ${variant === 'inline' ? 'px-2 py-1 text-sm rounded' : 'px-3 py-2 rounded-lg mt-1 w-56'} ${className}`} 
      {...props} 
    />
  );
});