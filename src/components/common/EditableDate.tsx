import { formatDate, formatLongDateLabel, formatShortDateLabel, parseDate } from "../../utils/dates";
import { Input } from "./Input";

interface EditableDateProps {
  date: Date;
  isEditing: boolean;
  onEdit: (newDate: Date) => void;
  dateFormat?: 'short' | 'long'
}

export function EditableDate({ date, isEditing, onEdit, dateFormat = 'short' }: EditableDateProps) {
  return (
    <div>
      {isEditing ? (
        <Input
          type="date"
          variant="inline"
          value={formatDate(date)}
          onChange={(e) => onEdit(parseDate(e.target.value))}
          className="w-32"
        />
      ) : (
        <span>{dateFormat === 'long' ? formatLongDateLabel(date) : formatShortDateLabel(date)}</span>
      )}
    </div>
  )
}