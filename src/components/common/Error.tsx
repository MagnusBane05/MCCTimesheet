export function Error({ message }: { message: string | undefined }) {
  return (
    <>
      {message && <p className="mt-1 text-sm text-red-700">{message}</p>}
    </>
  );
}