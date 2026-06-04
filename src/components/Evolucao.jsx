import { useLancamentos } from '../hooks/useLancamentos';
import { evolucaoMensal } from '../core/calculos';
import Card from './ui/Card';
import { formatarBRL } from './ui/Money';

// Gráfico de barras simples (SVG puro, sem biblioteca pesada) — saldo dos últimos 6 meses
export default function Evolucao() {
  const { lancamentos } = useLancamentos();
  const meses = evolucaoMensal(lancamentos, 6);
  const max = Math.max(1, ...meses.map((m) => Math.abs(m.saldo)));
  const temDados = meses.some((m) => m.saldo !== 0);

  return (
    <Card>
      <p className="font-num text-lg mb-4">📈 Evolução do saldo</p>
      {!temDados ? (
        <p className="text-muted text-sm">Sem histórico ainda. Lance alguns meses pra ver a curva.</p>
      ) : (
        <div className="flex items-end justify-between gap-2 h-36">
          {meses.map((m, i) => {
            const h = (Math.abs(m.saldo) / max) * 100;
            const pos = m.saldo >= 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[0.55rem] text-muted/70">{m.saldo !== 0 ? Math.round(m.saldo / 100) / 10 + 'k' : ''}</span>
                <div className={`w-full rounded-t-md transition-all ${pos ? 'bg-positive/70' : 'bg-negative/70'}`}
                  style={{ height: `${Math.max(h, m.saldo !== 0 ? 4 : 0)}%` }} title={formatarBRL(m.saldo)} />
                <span className="text-[0.6rem] text-muted">{m.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
