import { TextArea } from "../common/TextArea";
import { Field, FieldProps } from "./Field";

export interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id">, FieldProps { }

export function TextAreaField({ label, pt, id, ariaLabel, required = false, error, readOnly, readOnlyContent, labelVariant, ...props }: TextAreaFieldProps) {
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
      <TextArea
        aria-label={ariaLabel}
        id={id}
        {...props}
      />
    </Field>
  )
}