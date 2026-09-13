import { Select } from "./Select";

interface ActiveToggleProps {
  active: boolean;
  editing: boolean;
  onToggle: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function ActiveToggle({ active, editing, onToggle }: ActiveToggleProps) {
  return (
    <div>
      {editing ? (
        <Select
          value={active ? 'Active' : 'Inactive'}
          variant="inline"
          onChange={onToggle}
          className="rounded-full px-0 py-0"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
      ) : (
        active ? (
          <div className="bg-green-100 text-green-700 rounded-full font-bold text-xs text-center py-1 px-2 w-min">Active</div>
        ) : (
          <div className="bg-red-100 text-red-700 rounded-full font-bold text-xs text-center py-1 px-2 w-min">Inactive</div>
        )
      )}
    </div>
  );
}