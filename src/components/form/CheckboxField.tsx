import { Checkbox, CheckboxProps } from "../common/Checkbox";
import { FieldProps } from "./Field";
import { Error } from "../common/Error.tsx"

interface CheckboxFieldProps extends Omit<CheckboxProps, "id">, Omit<FieldProps, "readOnlyContent"> { }

export function CheckboxField({ label, pt, id, ariaLabel, required = false, error, readOnly, labelVariant, ...props }: CheckboxFieldProps) {
	return (
		<div className={pt?.container}>
			<label
				htmlFor={id}
				className={`inline-flex items center gap-2 
					${labelVariant === 'small' ? 'text-xs uppercase tracking-wide text-lakehouse-900/60' : 'text-sm text-lakehouse-900'}
					${pt?.label}`}
			>
				<Checkbox aria-label={ariaLabel} id={id} disabled={readOnly} {...props} />
				{label} {required && <span className="text-red-500">*</span>}
			</label>	
			{error && <Error message={error} />}
		</div>
	)
}
