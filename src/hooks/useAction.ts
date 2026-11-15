import { useRef, useState } from 'react';
import { formatError } from '../utils/errors';

export function useAction(reload?: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function run(request: () => Promise<unknown>, onSuccess?: () => void) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await request();
      onSuccess?.();
      await reload?.();
      return true;
    } catch (e) {
      setError(formatError(e));
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return { run, pending, error, setError };
}
