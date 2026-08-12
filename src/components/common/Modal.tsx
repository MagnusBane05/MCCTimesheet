import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
}

/** Generic overlay dialog, following the same fixed-overlay pattern as ConfirmDialog. */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-white shadow-xl focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-navy-900/10 px-4 py-3">
          <h2 id="modal-title" className="text-base font-semibold text-navy-950">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-900/60 hover:bg-cream-100 hover:text-navy-950"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
