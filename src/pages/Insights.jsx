import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { chaveMes, gerarInsights, gastosPorCategoria, evolucaoMensal, comparaMeses } from '../core/calculos';
import { infoCategoria } from '../core/schema';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

export default function Insights() {
  const { lancamentos } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const ym = chaveMes();

  const insights = gerarInsights({ lancs: lancamentos, recorrentes, parcelamentos, ym });
  const cats = gastosPorCategoria(lancamentos, ym);
  const evo = evolucaoMensal(lancamentos, 6);
  const maxValor = Math.max(...evo.map((m) => Math.max(m.receitas, m.despesas)), 1);
  const maiorCat = cats[0]?.total || 1;

  return (
    <div className="space-y-5">
      {/* EXPLICAÇÃO */}
      <Card className="bg-accent/5 border-accent/20">
        <p className="text-sm text-cream/90"><strong>📊 Pra que serve:</strong> aqui você entende <strong>pra onde vai seu dinheiro</strong> — evolução dos últimos meses, em quais categorias gasta mais, e dicas automáticas do que melhorar.</p>
      </Card>

      {/* EVOLUÇÃO 6 MESES */}
      <Card className="space-y-4">
        <p className="font-num text-xl font-semibold">📈 Evolução (6 meses)</p>
        <div className="flex items-end justify-between gap-2 h-40">
          {evo.map((m) => (
            <div key={m.ym} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-0.5 h-full">
                <div className="w-1/2 bg-positive/70 rounded-t" style={{ height: `${(m.receitas / maxValor) * 100}%` }} title={`Entrou: ${formatarBRL(m.receitas)}`} />
                <div className="w-1/2 bg-negative/70 rounded-t" style={{ height: `${(m.despesas / maxValor) * 100}%` }} title={`Saiu: ${formatarBRL(m.despesas)}`} />
              </div>
              <span className="text-muted text-[0.6rem]">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-positive/70 rounded-sm" /> Entrou</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-negative/70 rounded-sm" /> Saiu</span>
        </div>
      </Card>

      {/* GASTOS POR CATEGORIA */}
      {cats.length > 0 && (
        <Card className="space-y-3">
          <p className="font-num text-xl font-semibold">🔎 Gastos por categoria</p>
          <div className="space-y-2.5">
            {cats.slice(0, 8).map((c) => {
              const info = infoCategoria(c.categoria);
              return (
                <div key={c.categoria}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cream/90">{info.icone} {info.label}</span>
                    <span className="font-num">{formatarBRL(c.total)}</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(c.total / maiorCat) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* DICAS AUTOMÁTICAS */}
      {insights.length > 0 && (
        <Card className="space-y-2">
          <p className="font-num text-xl font-semibold">💡 Dicas</p>
          {insights.map((ins, i) => (
            <div key={i} className={`text-sm rounded-lg px-3 py-2 ${ins.tipo === 'alerta' ? 'bg-negative/10 text-negative' : 'bg-surface-2 text-cream/90'}`}>
              {ins.icone} {ins.texto}
            </div>
          ))}
        </Card>
      )}

      {cats.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-muted text-sm">Lance alguns gastos pra ver suas análises aqui.</p>
        </Card>
      )}
    </div>
  );
}
