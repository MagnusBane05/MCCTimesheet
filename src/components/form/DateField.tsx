import { Input, InputProps } from "../common/Input";
import { Field, FieldProps } from "./Field";

interface DateFieldProps extends Omit<InputProps, 'id'>, FieldProps { }

export function DateField({ id, label, pt, ariaLabel, required, error, readOnly, readOnlyContent, labelVariant, ...props }: DateFieldProps) {
  return (
    <Field 
      label={label}
      pt={pt}
      id={id}
      ariaLabel={ariaLabel}
      required={required}
      error={error}
      readOnly={readOnly}
      readOnlyContent={readOnlyContent}
      value={props.value}  
      labelVariant={labelVariant}
    >
      <Input 
        type="date"
        id={id}
        aria-label={ariaLabel}
        {...props}
      />
    </Field>
  );
}