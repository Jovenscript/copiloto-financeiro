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
                <button key={c.categoria} onClick={() => setCatAberta(c.categoria)} className="block w-full text-left active:opacity-70 transition">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cream/90">{info.icone} {info.label}</span>
                    <span className="font-num">{formatarBRL(c.total)} ›</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(c.total / maiorCat) * 100}%` }} />
                  </div>
                </button>
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

      {/* HISTÓRICO DA CATEGORIA — toca numa categoria acima pra abrir */}
      {catAberta && <HistoricoCategoria categoria={catAberta} lancamentos={lancamentos} onFechar={() => setCatAberta(null)} />}

      {cats.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-muted text-sm">Lance alguns gastos pra ver suas análises aqui.</p>
        </Card>
      )}
    </div>
  );
}

// Histórico completo de uma categoria, filtrável por mês.
function HistoricoCategoria({ categoria, lancamentos, onFechar }) {
  const info = infoCategoria(categoria);
  // meses disponíveis = meses em que houve gasto nessa categoria
  const meses = [...new Set(
    lancamentos.filter((l) => l.tipo === 'despesa' && l.categoria === categoria).map((l) => (l.data || '').slice(0, 7))
  )].filter(Boolean).sort().reverse();
  const [mes, setMes] = useState(meses[0] || chaveMes());

  const itens = lancamentos
    .filter((l) => l.tipo === 'despesa' && l.categoria === categoria && (l.data || '').startsWith(mes))
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const total = itens.reduce((s, l) => s + (Number(l.valor) || 0), 0);

  const labelMes = (ym) => {
    const [a, m] = ym.split('-');
    return new Date(Number(a), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <Card className="space-y-3 border border-accent/30">
      <div className="flex items-center justify-between">
        <p className="font-num text-lg text-cream">{info.icone} Histórico · {info.label}</p>
        <button onClick={onFechar} className="text-muted hover:text-cream text-lg leading-none px-1">×</button>
      </div>

      {/* filtro de mês */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {meses.map((m) => (
          <button key={m} onClick={() => setMes(m)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs capitalize transition ${mes === m ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>
            {labelMes(m)}
          </button>
        ))}
      </div>

      <div className="bg-surface-2 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-muted text-xs uppercase tracking-wide">Total no mês</span>
        <span className="font-num text-lg text-cream">{formatarBRL(total)}</span>
      </div>

      {itens.length === 0 ? (
        <p className="text-muted text-sm">Nenhum gasto nessa categoria em {labelMes(mes)}.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {itens.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-sm border-b border-line/60 pb-1.5">
              <div className="min-w-0">
                <p className="text-cream/90 truncate">{l.descricao}</p>
                <p className="text-muted text-xs">{l.data.slice(8, 10)}/{l.data.slice(5, 7)}/{l.data.slice(0, 4)}</p>
              </div>
              <span className="font-num text-negative shrink-0 pl-2">− {formatarBRL(l.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
