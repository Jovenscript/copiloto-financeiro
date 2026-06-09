import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { useCompromissos } from '../hooks/useCompromissos';
import { chaveMes, panoramaMes, vencimentosProximos, gerarAvisos, patrimonio } from '../core/calculos';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

export default function Inicio() {
  const nav = useNavigate();
  const { lancamentos, carregando } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { cofres } = useCofres();
  const { compromissos } = useCompromissos();
  const ym = chaveMes();

  if (carregando) return <Esqueleto />;

  const pan = panoramaMes({ lancs: lancamentos, recorrentes, parcelamentos, cofres, ym });
  const pat = patrimonio(cofres);
  const venc = vencimentosProximos({ recorrentes, parcelamentos, dias: 7 });
  const urgentes = gerarAvisos({ lancs: lancamentos, recorrentes, parcelamentos, cofres, compromissos, ym }).filter((a) => a.urgencia === 'alta');
  const positivo = pan.disponivel >= 0;

  return (
    <div className="space-y-6">
      {/* ALERTA URGENTE */}
      {urgentes.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-negative/15 border border-negative/40 rounded-2xl p-4">
          <p className="text-negative font-medium text-sm mb-2">🔴 Precisa de atenção</p>
          {urgentes.map((a, i) => (
            <p key={i} className="text-sm text-cream/90">{a.icone} <strong>{a.titulo}</strong> — {a.texto}</p>
          ))}
        </motion.div>
      )}

      {/* HERÓI — Disponível este mês */}
      <Card className="text-center py-8 md:py-10 bg-gradient-to-b from-surface-2 to-surface">
        <p className="text-muted text-xs uppercase tracking-[0.2em] mb-2">Disponível este mês</p>
        <div className={`font-num text-5xl md:text-7xl font-semibold tracking-tight ${positivo ? 'text-positive' : 'text-negative'}`}>
          {formatarBRL(pan.disponivel)}
        </div>
        <p className="text-muted text-sm mt-3">depois de gastos, contas e o que vai guardar</p>
        {pan.saude.nivel !== '—' && (
          <span className={`inline-block mt-3 text-xs px-3 py-1 rounded-full border border-line ${pan.saude.cor === 'positive' ? 'text-positive' : pan.saude.cor === 'negative' ? 'text-negative' : 'text-accent'}`}>
            Saúde: {pan.saude.nivel}
          </span>
        )}
      </Card>

      {/* GRID PRINCIPAL — Entrou / Saiu / Comprometido / Guardar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Bloco rotulo="Entrou" valor={pan.receitas} cor="text-positive" sub="receitas do mês" />
        <Bloco rotulo="Saiu" valor={pan.despesas} cor="text-negative" sub="já gasto" />
        <Bloco rotulo="A pagar" valor={pan.compRec + pan.compParc} cor="text-cream" sub="contas + parcelas" />
        <Bloco rotulo="A guardar" valor={pan.compCofres} cor="text-accent" sub="metas do mês" />
      </div>

      {/* PATRIMÔNIO — visão de banco, com realidade dos valores */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-num text-xl font-semibold">🏦 Patrimônio</p>
          <button onClick={() => nav('/financas')} className="text-accent text-sm">ver metas →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-positive/10 border border-positive/30 rounded-xl px-4 py-3">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">Patrimônio líquido</p>
            <p className="font-num text-2xl md:text-3xl text-positive">{formatarBRL(pat.liquido)}</p>
            <p className="text-muted text-xs mt-1">o que é realmente seu</p>
          </div>
          <div className="bg-surface-2 border border-line rounded-xl px-4 py-3">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">Total guardado</p>
            <p className="font-num text-2xl md:text-3xl">{formatarBRL(pat.guardadoBruto)}</p>
            <p className="text-muted text-xs mt-1">em todos os cofres</p>
          </div>
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">A devolver</p>
            <p className="font-num text-2xl md:text-3xl text-negative">{formatarBRL(pat.aDevolver)}</p>
            <p className="text-muted text-xs mt-1">dívidas dentro do guardado</p>
          </div>
        </div>
        {pat.aDevolver > 0 && (
          <p className="text-xs text-muted bg-bg rounded-lg px-3 py-2">
            ⚠ Você tem {formatarBRL(pat.guardadoBruto)} guardado, mas {formatarBRL(pat.aDevolver)} são compromisso (ex: a devolver aos pais). Disponível de verdade: <strong className="text-positive">{formatarBRL(pat.liquido)}</strong>.
          </p>
        )}
      </Card>

      {/* PRÓXIMOS VENCIMENTOS */}
      {venc.length > 0 && (
        <Card className="space-y-3">
          <p className="font-num text-xl font-semibold">📅 Próximos 7 dias</p>
          <div className="space-y-2">
            {venc.slice(0, 6).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-line/50 pb-2 last:border-0">
                <span className="text-cream/90">{v.descricao}</span>
                <div className="text-right">
                  <span className="font-num text-cream">{formatarBRL(v.valor)}</span>
                  <span className="text-muted text-xs block">{v.data.slice(8, 10)}/{v.data.slice(5, 7)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* METAS — mini status */}
      {cofres.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-num text-xl font-semibold">🎯 Suas metas</p>
            <button onClick={() => nav('/financas')} className="text-accent text-sm">abrir →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cofres.map((c) => {
              const pct = c.alvo > 0 ? Math.min(100, (c.guardado / c.alvo) * 100) : 0;
              return (
                <div key={c.id} className="bg-surface-2 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{c.icone} {c.nome}</span>
                    <span className="font-num text-accent text-sm">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-muted text-xs mt-1.5">{formatarBRL(c.guardado)} de {formatarBRL(c.alvo)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function Bloco({ rotulo, valor, cor, sub }) {
  return (
    <Card className="px-4 py-4">
      <p className="text-muted text-[0.7rem] uppercase tracking-wider mb-1">{rotulo}</p>
      <p className={`font-num text-xl md:text-2xl font-semibold ${cor}`}>{formatarBRL(valor)}</p>
      {sub && <p className="text-muted text-[0.65rem] mt-1">{sub}</p>}
    </Card>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-40 bg-surface rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-surface rounded-2xl" />)}
      </div>
      <div className="h-48 bg-surface rounded-2xl" />
    </div>
  );
}
