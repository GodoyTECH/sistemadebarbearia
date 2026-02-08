export function Currency({ value, className }: { value: number; className?: string }) {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);

  return <span className={className}>{formatted}</span>;
}
