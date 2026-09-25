export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`
        mt-1 w-full rounded-lg border border-lakehouse-900/20 p
        x-3 py-2.5 text-base 
        focus:border-cedar-500 focus:outline-none focus:ring-1 focus:ring-cedar-500
        ${className}`}
      {...props}
    />
  );
}