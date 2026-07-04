// Cartão base do tema. Tema claro usa sombra suave, não borda pesada.
export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-surface border border-line shadow-card rounded-[var(--radius-card)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
