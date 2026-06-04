import { motion } from 'motion/react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { chaveMes, panoramaMes, gastosPorCategoria, comparaMeses, vencimentosProximos } from '../core/calculos';
import { infoCategoria } from '../core/schema';
import Card from '../components/ui/Card';
import Money, { formatarBRL } from '../components/ui/Money';

const aparece = {
  hidden: { opacity: 0, y: 12 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};
const CORES = { positive: 'text-positive', negative: 'text-negative', accent: 'text-accent', muted: 'text-muted' };

export default function Inicio() {
  const { lancamentos, carregando } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { cofres } = useCofres();
  const ym = chaveMes();

  if (carregando) return <Esqueleto />;

  const pan = panoramaMes({ lancs: lancamentos, recorrentes, parcelamentos, cofres, ym });
  const cats = gastosPorCategoria(lancamentos, ym).slice(0, 5);
  const comp = comparaMeses(lancamentos, ym);
  const venc = vencimentosProximos({ recorrentes, parcelamentos, dias: 7 });
  const maiorCat = cats[0]?.total || 1;
  const positivo = pan.disponivel >= 0;

  return (
    <div className="space-y-5">
      {/* HERÓI — disponível de verdade */}
      <motion.div custom={0} variants={aparece} initial="hidden" animate="show">
        <Card className="text-center py-8 bg-gradient-to-b from-surface-2 to-surface">
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-muted text-xs uppercase tracking-[0.2em]">Disponível este mês</p>
          </div>
          <div className={`font-num text-6xl font-semibold tracking-tight ${positivo ? 'text-positive' : 'text-negative'}`}>
            {formatarBRL(pan.disponivel)}
          </div>
          <p className="text-muted text-sm mt-3">
            depois de gastos, contas a pagar e metas
          </p>
          {pan.saude.nivel !== '—' && (
            <span className={`inline-block mt-3 text-xs px-3 py-1 rounded-full border border-line ${CORES[pan.saude.cor]}`}>
              Saúde: {pan.saude.nivel}
            </span>
          )}
        </Card>
      </motion.div>

      {/* 3 colunas: entrou / saiu / comprometido */}
      <motion.div custom={1} variants={aparece} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
        <Card className="px-3 py-4">
          <p className="text-muted text-[0.7rem] mb-1">Entrou</p>
          <Money valor={pan.receitas} className="text-lg text-positive" />
        </Card>
        <Card className="px-3 py-4">
          <p className="text-muted text-[0.7rem] mb-1">Saiu</p>
          <Money valor={pan.despesas} className="text-lg text-negative" />
        </Card>
        <Card className="px-3 py-4">
          <p className="text-muted text-[0.7rem] mb-1">Comprometido</p>
          <Money valor={pan.comprometido} className="text-lg text-cream/90" />
        </Card>
      </motion.div>

      {/* próximos vencimentos */}
      {venc.length > 0 && (
        <motion.div custom={2} variants={aparece} initial="hidden" animate="show">
          <Card>
            <p className="font-num text-lg mb-3">⏰ Próximos 7 dias</p>
            <div className="space-y-2">
              {venc.map((v) => (
                <div key={v.id} className="flex justify-between items-center text-sm">
                  <span>{infoCategoria(v.categoria).icone} {v.descricao}</span>
                  <span className="text-muted">dia {v.data.slice(8)} · <Money valor={v.valor} className="text-cream/90" /></span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* comparação */}
      {comp.variacaoDespesaPct !== null && (
        <motion.div custom={3} variants={aparece} initial="hidden" animate="show">
          <Card className="flex items-center gap-3">
            <span className="text-2xl">{comp.variacaoDespesaPct > 0 ? '📈' : '📉'}</span>
            <p className="text-sm text-cream/90">
              Você gastou{' '}
              <strong className={comp.variacaoDespesaPct > 0 ? 'text-negative' : 'text-positive'}>
                {Math.abs(comp.variacaoDespesaPct).toFixed(0)}% {comp.variacaoDespesaPct > 0 ? 'a mais' : 'a menos'}
              </strong>{' '}que mês passado.
            </p>
          </Card>
        </motion.div>
      )}

      {/* pra onde foi */}
      <motion.div custom={4} variants={aparece} initial="hidden" animate="show">
        <Card>
          <p className="font-num text-lg mb-4">Pra onde foi o dinheiro</p>
          {cats.length === 0 ? (
            <p className="text-muted text-sm">Nenhum gasto este mês ainda.</p>
          ) : (
            <div className="space-y-3">
              {cats.map((c) => {
                const info = infoCategoria(c.categoria);
                const pct = (c.total / maiorCat) * 100;
                return (
                  <div key={c.categoria}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{info.icone} {info.label}</span>
                      <Money valor={c.total} className="text-cream/90" />
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-48 bg-surface rounded-[var(--radius-card)]" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 bg-surface rounded-[var(--radius-card)]" />
        <div className="h-20 bg-surface rounded-[var(--radius-card)]" />
        <div className="h-20 bg-surface rounded-[var(--radius-card)]" />
      </div>
      <div className="h-40 bg-surface rounded-[var(--radius-card)]" />
    </div>
  );
}
