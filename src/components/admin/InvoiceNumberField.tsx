import { useEffect, useState } from 'react';
import { Button } from '../common/Button';

/** Inline "invoice number" editor shown beside an individual time entry. Read-only for VIEWER. */
export function InvoiceNumberField({
  value,
  readOnly,
  onSave,
}: {
  value: string | null;
  readOnly: boolean;
  onSave(invoiceNumber: string | null): Promise<void>;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  if (readOnly) {
    return <span className="text-sm text-navy-900/80">{value || '—'}</span>;
  }

  const dirty = draft.trim() !== (value ?? '');

  async function handleSave() {
    setSaving(true);
    setError(false);
    try {
      await onSave(draft.trim() === '' ? null : draft.trim());
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="invoice-number" className="sr-only">
        Invoice number
      </label>
      <input
        id="invoice-number"
        type="text"
        value={draft}
        placeholder="No invoice number"
        onChange={(event) => setDraft(event.target.value)}
        className="w-36 rounded-lg border border-navy-900/20 px-2.5 py-1.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
      />
      {dirty && (
        <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      )}
      {error && <span className="text-xs text-red-700">Unable to save.</span>}
    </div>
  );
}
