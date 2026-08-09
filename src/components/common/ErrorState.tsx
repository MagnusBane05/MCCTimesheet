import { Button } from './Button';

export function ErrorState({
  message = 'Unable to load data. Please try again.',
  onRetry,
}: {
  message?: string;
  onRetry?(): void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 py-12 text-center text-red-800">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
