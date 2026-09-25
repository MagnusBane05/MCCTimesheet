import { TimeSelect, type TimeSelectProps } from "../common/TimeSelect";
import { Field, type FieldProps } from "./Field";

interface TimeFieldProps extends Omit<TimeSelectProps, 'id'>, FieldProps { }

export function TimeField({ id, label, pt, ariaLabel, required, error, readOnly, readOnlyContent, ...props }: TimeFieldProps) {
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
    >
      <TimeSelect 
        id={id}
        ariaLabel={ariaLabel}
        {...props}      />
    </Field>
  );
}