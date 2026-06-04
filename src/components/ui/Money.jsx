// Componentizar dinheiro: sempre formata BRL igual e (opcional)
// colore pelo sinal. Reaproveitado no app inteiro.
import { LOCALE, MOEDA } from '../../config';

export function formatarBRL(v) {
  return Number(v || 0).toLocaleString(LOCALE, { style: 'currency', currency: MOEDA });
}

export default function Money({ valor, colorir = false, className = '' }) {
  const cor = !colorir
    ? ''
    : valor > 0
    ? 'text-positive'
    : valor < 0
    ? 'text-negative'
    : 'text-muted';
  return <span className={`font-num ${cor} ${className}`}>{formatarBRL(valor)}</span>;
}
