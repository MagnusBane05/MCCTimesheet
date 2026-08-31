import { forwardRef, type ComponentType, type SVGProps } from "react";

import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, className, ...props }: IconButtonProps,
  ref
) {
  return (  
    <button 
      ref={ref} 
      type="button" 
      className={`flex items-center gap-2 text-navy-950 ${className}`}
      {...props}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
});