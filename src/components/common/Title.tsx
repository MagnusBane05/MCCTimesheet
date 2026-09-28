export function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={`text-2xl font-semibold mb-2 text-midnight-950 ${className}`}>{children}</h1>;
}