import { forwardRef } from "react";

export const TableHeader = forwardRef<HTMLTableCellElement, React.HTMLAttributes<HTMLTableCellElement>>(function TableHeader(
  { className = '', ...props },
  ref
) {
  return (
    <th
      ref={ref}
      className={`bg-navy-950/10 px-4 py-2 text-left text-sm font-semibold text-navy-950 ${className}`}
      {...props}
    />
  )
});

export const TableCell = forwardRef<HTMLTableCellElement, React.HTMLAttributes<HTMLTableCellElement>>(function TableCell(
  { className = '', ...props },
  ref
) {
  return (
    <td
      ref={ref}
      className={`px-4 py-2 text-sm text-navy-950 ${className}`}
      {...props}
    />
  )
});

export const TableRow = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(function TableRow(
  { className = '', ...props },
  ref
) {
  return (
    <tr
      ref={ref}
      className={`border-b border-navy-900/10 hover:bg-navy-950/5 ${className}`}
      {...props}
    />
  )
});

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  rounded?: boolean;
  bordered?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className = '', striped = false, rounded = false, bordered = false, ...props }, 
  ref
) {
  return (
    <table
      ref={ref}
      className={`
        w-full border-separate border-spacing-0
        ${bordered ? 'border border-navy-900/20' : ''} bg-white 
        ${rounded ? 'rounded-lg [&_thead_th:first-child]:rounded-tl-lg [&_thead_th:last-child]:rounded-tr-lg' : ''}
        ${striped ? '[&_tbody_tr:nth-child(even)]:bg-navy-950/5' : ''} 
        ${className}`}
      {...props}
    />
  )
});