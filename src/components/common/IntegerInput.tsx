import { forwardRef } from "react";

type InputVariant = 'default' | 'inline';

export interface IntegerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

export const IntegerInput = forwardRef<HTMLInputElement, IntegerInputProps>(function IntegerInput(
  { variant = 'default', className = '', ...props }, ref) {
  return (
    <input 
      id={props.id} 
      ref={ref} 
      className={`
        border border-lakehouse-900/20 text-sm w-14 p-0 m-0
        focus:border-cedar-500 focus:outline-none focus:ring-1 focus:ring-cedar-500 
        ${variant === 'inline' ? 'text-sm rounded' : 'px-3 py-2 rounded mt-1'} ${className}`} 
      {...props} 
    />
  );
});
