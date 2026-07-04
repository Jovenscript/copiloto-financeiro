import { useState } from 'react';
import { ChevronDown, TrendingDown, AlertTriangle } from 'lucide-react';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { chaveMes, projetarMeses } from '../core/calculos';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

// 24 meses calculados AO VIVO a partir dos seus dados reais — nunca um
// arquivo estático. Editou uma parcela ou marcou algo pago? Reflete na hora.
export default function Projecao() {
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const [aberto, setAberto] = useState(null);

  const meses = projetarMeses({ recorrentes, parcelamentos, mesesAFrente: 24, ymInicio: chaveMes() });
  const totalGeral = meses.reduce((s, m) => s + m.total, 0);
  const media = totalGeral / meses.length;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-muted text-xs uppercase tracking-wide mb-1">Total comprometido — 24 meses</p>
        <p className="font-num text-3xl text-cream">{formatarBRL(totalGeral)}</p>
        <p className="text-muted text-xs mt-1">média de {formatarBRL(media)}/mês</p>
      </Card>

      <div className="space-y-2">
        {meses.map((m, i) => {
          const expandido = aberto === i;
          const quedaVsAnterior = i > 0 && m.total < meses[i - 1].total;
          return (
            <Card key={m.ym} className="!p-0 overflow-hidden">
              <button onClick={() => setAberto(expandido ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-cream capitalize truncate">{m.label}</span>
                  {quedaVsAnterior && <TrendingDown size={14} className="text-positive shrink-0" />}
                  {m.acabandoEmBreve.length > 0 && <AlertTriangle size={13} className="text-accent shrink-0" />}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-num text-sm text-cream">{formatarBRL(m.total)}</span>
                  <ChevronDown size={16} className={`text-muted transition-transform ${expandido ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandido && (
                <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
                  {m.acabandoEmBreve.length > 0 && (
                    <p className="text-xs text-accent bg-accent/8 rounded-lg px-3 py-2">
                      Terminando: {m.acabandoEmBreve.join(', ')}
                    </p>
                  )}
                  <div>
                    <p className="text-muted text-[0.65rem] uppercase mb-1.5">Contas fixas · {formatarBRL(m.totalRecorrentes)}</p>
                    {m.recorrentes.map((it, j) => (
                      <div key={j} className="flex justify-between text-xs py-1 text-cream/80">
                        <span>{it.nome}</span><span className="font-num">{formatarBRL(it.valor)}</span>
                      </div>
                    ))}
                  </div>
                  {m.parcelamentos.length > 0 && (
                    <div>
                      <p className="text-muted text-[0.65rem] uppercase mb-1.5">Cartão / parcelas · {formatarBRL(m.totalParcelamentos)}</p>
                      {m.parcelamentos.map((it, j) => (
                        <div key={j} className={`flex justify-between text-xs py-1 ${it.acabando ? 'text-accent' : 'text-cream/80'}`}>
                          <span>{it.nome}</span><span className="font-num">{formatarBRL(it.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
