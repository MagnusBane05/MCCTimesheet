import { Input, InputProps } from "../common/Input";
import { Field, FieldProps } from "./Field";

export interface TextFieldProps extends Omit<InputProps, "id">, FieldProps { }

export function TextField({ label, pt, id, ariaLabel, required = false, error, readOnly, readOnlyContent, labelVariant, ...props }: TextFieldProps) {
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
        type="text"
        aria-label={ariaLabel}
        id={id}
        {...props}
      />
    </Field>
  )
}