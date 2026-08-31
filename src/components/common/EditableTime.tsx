import { formatTimeLabel } from "../../utils/time";
import { TimeSelect } from "./TimeSelect";

interface EditableTimeProps {
  time: string;
  label: string;
  isEditing: boolean;
  onEdit: (newTime: string) => void;
  variant?: '12' | '24';
  minuteStep?: number;
}

export function EditableTime({ time, isEditing, onEdit, variant, label, minuteStep }: EditableTimeProps) {
  return (
    <div>
      {isEditing ? (
        <TimeSelect
          value={time}
          onChange={(newTime) => onEdit(newTime)} 
          label={label} 
          today={new Date()}      
          variant="inline"  
          timeVariant={variant}
          minuteStep={minuteStep}
        />
      ) : (
        <span>{formatTimeLabel(time, variant)}</span>
      )}
    </div>
  )
}