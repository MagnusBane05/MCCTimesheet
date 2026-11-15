import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { TextField } from '../form/TextField';
import { useAction } from '../../hooks/useAction';

interface InvoiceNumberFieldProps {
  value: string | null;
  id: string;
  ariaLabel: string;
  readOnly: boolean;
  onSave(invoiceNumber: string | null): Promise<void>;
}

/** Inline "invoice number" editor shown beside an individual time entry. Read-only for VIEWER. */
export function InvoiceNumberField({
  value,
  id,
  ariaLabel,
  readOnly,
  onSave,
}: InvoiceNumberFieldProps) {
  const [draft, setDraft] = useState(value ?? '');
  const save = useAction();

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  if (readOnly) {
    return <span className="text-sm text-lakehouse-900/80">{value || '—'}</span>;
  }

  const dirty = draft.trim() !== (value ?? '');

  async function handleSave() {
    await save.run(() => onSave(draft.trim() === '' ? null : draft.trim()));
  }

  return (
    <div className="flex items-center gap-2">
      <TextField
        id={id}
        ariaLabel={ariaLabel}
        type="text"
        variant='inline'
        value={draft}
        error={save.error ?? undefined}
        placeholder="No invoice number"
        onChange={(event) => setDraft(event.target.value)}
        className="w-36"
      />
      {dirty && (
        <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={handleSave} disabled={save.pending}>
          {save.pending ? 'Saving…' : 'Save'}
        </Button>
      )}
    </div>
  );
}
