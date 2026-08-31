import { Select } from "./Select";

interface EditableSelectProps<T> {
  text: string;
  value: T;
  id: string;
  isEditing: boolean;
  onChange(value: string): void;
  children: React.ReactNode;
}

export function EditableSelect<T extends string | number>({
  text,
  value,
  id,
  isEditing,
  onChange,
  children,
}: EditableSelectProps<T>) {
  return (
    <div>
      {isEditing ? (
        <Select 
          id={id} 
          value={value} 
          variant='inline'
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </Select>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}