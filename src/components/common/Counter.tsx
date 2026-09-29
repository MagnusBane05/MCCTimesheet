type Variant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-white',
  secondary: 'bg-white',
};

const VARIANT_NUMBER_CLASSES: Record<Variant, string> = {
  primary: 'text-cedar-500',
  secondary: 'text-cedar-500',
};

interface CounterProps {
  title: string;
  number: number | string;
  variant?: Variant;
}

export function Counter({title, number, variant = 'primary'}: CounterProps) {
  return (
    <div className={`flex flex-col items-center border rounded p-2 shadow-sm ${VARIANT_CLASSES[variant]}`}>
      <p className='text-xs font-medium uppercase text-lakehouse-900'>{title}</p>
      <p className={`font-bold text-lg ${VARIANT_NUMBER_CLASSES[variant]}`}>{number}</p>
    </div>
  );
}