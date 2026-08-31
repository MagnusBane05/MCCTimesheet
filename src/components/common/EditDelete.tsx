import { CheckIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { IconButton } from "./IconButton";

interface EditDeleteProps {
  isEditing: boolean;
  submitting?: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export function EditDelete({ 
  isEditing, 
  submitting = false, 
  disabled = false, 
  onEdit, 
  onCancelEdit, 
  onSave, 
  onDelete 
}: EditDeleteProps) {
  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <IconButton 
            icon={CheckIcon} 
            onClick={onSave} 
            disabled={submitting || disabled}
            className='p-1 hover:bg-navy-950/10 hover:rounded'
            aria-label="Save changes"
          />
          <IconButton 
            icon={XMarkIcon} 
            onClick={onCancelEdit} 
            disabled={submitting || disabled}
            className='p-1 hover:bg-navy-950/10 hover:rounded'
            aria-label="Cancel editing" 
          />
        </>
      ) : (
        <>
          <IconButton 
            icon={PencilIcon} 
            onClick={onEdit} 
            disabled={disabled}
            className='p-1 hover:bg-navy-950/10 hover:rounded'
            aria-label="Edit row" 
          />
          {onDelete && (
            <IconButton 
              icon={TrashIcon} 
              onClick={onDelete} 
              disabled={disabled}
              className='p-1 hover:bg-navy-950/10 hover:rounded'
              aria-label="Delete row" 
            />
          )}
        </>
      )}
    </div>
  );
}