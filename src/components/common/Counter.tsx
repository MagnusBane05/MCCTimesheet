type Variant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'border-accent-600/20 bg-accent-600/10',
  secondary: 'border-navy-950/10 bg-navy-950/5',
};

const VARIANT_NUMBER_CLASSES: Record<Variant, string> = {
  primary: 'text-accent-600',
  secondary: 'text-navy-950',
};

interface CounterProps {
  title: string;
  number: number;
  variant?: Variant;
}

export function Counter({title, number, variant = 'primary'}: CounterProps) {
  return (
    <div className={`flex flex-col items-center border rounded-lg p-2 shadow-sm ${VARIANT_CLASSES[variant]}`}>
      <p className='text-xs font-medium text-navy-900/60'>{title}</p>
      <p className={`font-bold text-lg ${VARIANT_NUMBER_CLASSES[variant]}`}>{number}</p>
    </div>
  );
}