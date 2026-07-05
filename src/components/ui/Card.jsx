// Cartão base — branco com sombra suave (design "cockpit" aprovado).
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface shadow-card rounded-[var(--radius-card)] p-5 ${className}`}>
      {children}
    </div>
  );
}
