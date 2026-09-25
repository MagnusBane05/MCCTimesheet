import { TimeSelect, TimeSelectProps } from "../common/TimeSelect";
import { Field, FieldProps } from "./Field";

interface TimeFieldProps extends Omit<TimeSelectProps, 'id' | 'label'>, FieldProps { }

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