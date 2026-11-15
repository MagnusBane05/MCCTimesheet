import { forwardRef } from "react";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
	{ className = '', ...props }, ref) {
	return (
		<input
			type="checkbox"
			ref={ref}
			className={`h-4 w-4 rounded border-lakehouse-900/20 accent-cedar-500 cursor-pointer
				focus:outline-none focus-ring-1 focus:ring-cedar-500
				disabled:cursor-not-allowed disavled:opacity-50 ${className}`}
			{...props}
		/>
	);
});
