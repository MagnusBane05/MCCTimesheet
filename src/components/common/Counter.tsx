type Variant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'border-cedar-500/40 bg-cedar-500/10',
  secondary: 'border-midnight-950/10 bg-midnight-950/5',
};

const VARIANT_NUMBER_CLASSES: Record<Variant, string> = {
  primary: 'text-cedar-500',
  secondary: 'text-midnight-950',
};

interface CounterProps {
  title: string;
  number: number;
  variant?: Variant;
}

export function Counter({title, number, variant = 'primary'}: CounterProps) {
  return (
    <div className={`flex flex-col items-center border rounded-lg p-2 shadow-sm ${VARIANT_CLASSES[variant]}`}>
      <p className='text-xs font-medium text-lakehouse-900/60'>{title}</p>
      <p className={`font-bold text-lg ${VARIANT_NUMBER_CLASSES[variant]}`}>{number}</p>
    </div>
  );
}