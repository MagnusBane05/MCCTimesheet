interface CounterProps {
  title: string;
  number: number;
}

export function Counter({title, number}: CounterProps) {
  return (
    <div className='flex flex-col items-center border border-navy-900/20 rounded-lg p-2'>
      <p className='text-sm font-medium text-navy-900/60'>{title}</p>
      <p className='font-bold'>{number}</p>
    </div>
  );
}