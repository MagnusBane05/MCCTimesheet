import { Input } from "./Input";

interface EditableTextProps {
  text: string;
  isEditing: boolean;
  onEdit: (newText: string) => void;
}

export function EditableText({ text, isEditing, onEdit }: EditableTextProps) {
  return (
    <div>
      {isEditing ? (
        <Input
          type="text"
          variant="inline"
          value={text}
          onChange={(e) => onEdit(e.target.value)}
        />
      ) : (
        text
      )}
    </div>
  );
}