import { IntegerInput, IntegerInputProps } from "../common/IntegerInput";
import { Field, type FieldProps } from "./Field";

interface IntegerFieldProps extends Omit<IntegerInputProps, "id">, FieldProps { }

export function IntegerField({ label, pt, id, ariaLabel, required, error, readOnly, readOnlyContent, labelVariant, ...props }: IntegerFieldProps) {
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
      <IntegerInput
	type="number"
        aria-label={ariaLabel}
        id={id}
        {...props}
      />
    </Field>
  );
}

