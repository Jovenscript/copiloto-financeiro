// Cartão base do tema. Pequeno, mas garante consistência visual.
export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-surface border border-line rounded-[var(--radius-card)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
