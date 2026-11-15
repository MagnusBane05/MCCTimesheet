import { XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import { IconButton } from "./IconButton";
import { ChangeEvent, KeyboardEvent } from "react";

interface EditableCardProps  {
	content: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	onDelete?: () => void;
	onSave?: () => void;
	/** Called when the user presses Escape in the input. */
	onCancel?: () => void;
	autoFocus?: boolean;
	disabled?: boolean;
	ariaLabel?: string;
	deleteLabel?: string;
}

export function EditableCard({
	content,
	onChange,
	onDelete,
	onSave,
	onCancel,
	autoFocus = false,
	disabled = false,
	ariaLabel,
	deleteLabel = "Delete",
}: EditableCardProps) {
	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && onSave) {
			e.preventDefault();
			onSave();
		} else if (e.key === "Escape" && onCancel) {
			e.preventDefault();
			onCancel();
		}
	}

	return <div className="rounded-full border bg-lake-800/10 px-2 flex gap-1 items-center">
		<input
			type="text"
			value={content}
			className="bg-lake-800/0 focus:italic focus:outline-none"
			style={{"fieldSizing": "content"}}
			onChange={onChange}
			onKeyDown={handleKeyDown}
			autoFocus={autoFocus}
			disabled={disabled}
			aria-label={ariaLabel}
		/>
		{!!onSave && <IconButton icon={CheckIcon} onClick={onSave} disabled={disabled} aria-label="Save" className="w-3 h-auto text-midnight-950"/>}
		{!!onDelete && <IconButton icon={XMarkIcon} onClick={onDelete} disabled={disabled} aria-label={deleteLabel} className="w-3 h-auto text-midnight-950"/>}
	</div>
}
