import { Select, SelectProps } from "../common/Select";
import { Field, FieldProps } from "./Field";

export interface SelectFieldProps extends Omit<SelectProps, "id">, FieldProps { }

export function SelectField({ label, pt, id, ariaLabel, required, error, readOnly, readOnlyContent, labelVariant, ...props }: SelectFieldProps) {
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
      <Select
        aria-label={ariaLabel}
        id={id}
        {...props}
      />
    </Field>
  );
}