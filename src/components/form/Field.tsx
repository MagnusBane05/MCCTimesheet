import { Error } from "../common/Error";

interface PassThroughProps {
  container?: string;
  label?: string;
  error?: string;
  readOnly?: string;
}

type labelVarient = 'default' | 'small';

export interface FieldProps {
  id: string;
  label?: string;
  ariaLabel: string
  required?: boolean;
  readOnly?: boolean;
  readOnlyContent?: React.ReactNode;
  error?: string;
  pt?: PassThroughProps;
  labelVariant?: labelVarient;
}

interface FieldComponentProps extends FieldProps {
  children: React.ReactNode;
  value?: string | number | readonly string[] | undefined;
}

export function Field({ label, pt, id, required = false, ariaLabel, error, readOnly, readOnlyContent, children, value, labelVariant = 'default' }: FieldComponentProps) {
  return (
    <div className={pt?.container}>
      {label && <label 
          htmlFor={id} 
          className={labelVariant === 'small' ? 
            `block text-xs font-medium uppercase tracking-wide text-lakehouse-900/60 ${pt?.label}` : 
            `block text-sm font-medium text-lakehouse-900 ${pt?.label}`
          }>
        {label} {required && <span className="text-red-500">*</span>}
      </label>}
      {readOnly ? (
        <div id={id} className={pt?.readOnly} aria-label={ariaLabel}>
          {readOnlyContent ? readOnlyContent : value}
        </div>
      ) : (
        children
      )}
      {error && <Error message={error} />}
    </div>
  );
}