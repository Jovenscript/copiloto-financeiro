import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, CalendarDays, User, TrendingUp, TrendingDown, PiggyBank, Check, Clock, ChevronRight, Heart } from 'lucide-react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { useCompromissos } from '../hooks/useCompromissos';
import { chaveMes, panoramaMes, vencimentosProximos, gerarAvisos, patrimonio } from '../core/calculos';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

const ACOES = [
  { rota: '/financas', rotulo: 'Lançar', Icone: Plus },
  { rota: '/metas',    rotulo: 'Metas',  Icone: Target },
  { rota: '/agenda',   rotulo: 'Agenda', Icone: CalendarDays },
  { rota: '/perfil',   rotulo: 'Perfil', Icone: User },
];

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
  const venc = vencimentosProximos({ recorrentes, parcelamentos, dias: 7 });
  const urgentes = gerarAvisos({ lancs: lancamentos, recorrentes, parcelamentos, cofres, compromissos, ym }).filter((a) => a.urgencia === 'alta');
  const patr = patrimonio(cofres);
  const positivo = pan.disponivel >= 0;

  const pagasMes = recorrentes.filter((r) => r.ultimoPago === ym).length + parcelamentos.filter((p) => p.ultimoPago === ym).length;
  const pctComprometido = pan.receitas > 0 ? Math.min(100, ((pan.despesas + pan.comprometido) / pan.receitas) * 100) : 0;

  const casamento = cofres.find((c) => /casamento|casar|noiv/i.test(c.nome || ''));

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

      {/* HERÓI — Disponível este mês (estilo conta corrente) */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-surface-2 to-surface py-7 md:py-9">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent/10 blur-2xl" />
        <p className="text-muted text-xs uppercase tracking-[0.2em] mb-1">Disponível este mês</p>
        <div className={`font-num glow text-5xl md:text-7xl font-semibold tracking-tight ${positivo ? 'text-positive' : 'text-negative'}`}>
          {formatarBRL(pan.disponivel)}
        </div>
        <p className="text-muted text-sm mt-2">de {formatarBRL(pan.receitas)} que entraram · este mês</p>
        <div className="mt-5 h-2 rounded-full bg-line overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pctComprometido}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent" />
        </div>
        <div className="flex justify-between text-[0.7rem] text-muted mt-1.5">
          <span>Comprometido {formatarBRL(pan.despesas + pan.comprometido)}</span>
          <span>{Math.round(pctComprometido)}%</span>
        </div>
      </Card>

      {/* AÇÕES RÁPIDAS */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {ACOES.map(({ rota, rotulo, Icone }) => (
          <button key={rota} onClick={() => nav(rota)}
            className="flex flex-col items-center gap-2 group">
            <span className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-surface border border-line grid place-items-center text-accent group-hover:border-accent group-hover:bg-accent/10 transition">
              <Icone size={22} />
            </span>
            <span className="text-xs md:text-sm text-cream">{rotulo}</span>
          </button>
        ))}
      </div>

      {/* STATS — Entrou / Saiu / Patrimônio */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat Icone={TrendingUp} cor="text-positive" rotulo="Entrou" valor={pan.receitas} />
        <Stat Icone={TrendingDown} cor="text-negative" rotulo="Saiu" valor={pan.despesas} />
        <Stat Icone={PiggyBank} cor="text-accent" rotulo="Guardado" valor={patr.liquido} />
      </div>

      {/* GRID — Contas | Cofres + Casamento */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* CONTAS DO MÊS */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-num text-xl font-semibold">Contas do mês</p>
            <span className="text-xs text-muted">
              <span className="text-positive">{pagasMes} pagas</span>
              {venc.length > 0 && <span className="text-negative"> · {venc.length} a vencer</span>}
            </span>
          </div>
          {venc.length === 0 ? (
            <p className="text-muted text-sm py-2 flex items-center gap-2"><Check size={16} className="text-positive" /> Nada vencendo nos próximos 7 dias. 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {venc.slice(0, 6).map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 bg-negative/12 text-negative"><Clock size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-sm text-cream truncate">{v.descricao}</p>
                      <p className="text-[0.7rem] text-muted">vence dia {v.data.slice(8, 10)}</p>
                    </div>
                  </div>
                  <span className="font-num text-sm text-cream shrink-0 pl-2">{formatarBRL(v.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* COFRINHOS */}
          {cofres.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-num text-xl font-semibold">Cofrinhos</p>
                <button onClick={() => nav('/metas')} className="text-accent text-sm flex items-center gap-0.5">ver tudo <ChevronRight size={15} /></button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible">
                {cofres.slice(0, 4).map((c) => {
                  const alvo = Number(c.alvo) || 0;
                  const pct = alvo > 0 ? Math.min(100, ((Number(c.guardado) || 0) / alvo) * 100) : 0;
                  const devolver = Number(c.devolver) || 0;
                  return (
                    <button key={c.id} onClick={() => nav('/metas')}
                      className="text-left shrink-0 w-[150px] lg:w-auto bg-surface border border-line rounded-2xl p-4 hover:border-accent transition">
                      <div className="flex items-center justify-between">
                        <Ring pct={pct}><span className="text-lg">{c.icone || '🎯'}</span></Ring>
                        {devolver > 0 && <span className="text-[0.6rem] text-negative border border-negative/60 rounded-full px-1.5 py-0.5">devolver</span>}
                      </div>
                      <p className="text-sm text-cream font-medium mt-3 truncate">{c.nome}</p>
                      <p className="font-num text-cream text-base">{formatarBRL(c.guardado)}</p>
                      <p className="text-[0.7rem] text-muted">{alvo > 0 ? `de ${formatarBRL(alvo)} · ${Math.round(pct)}%` : 'sem alvo'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PLANEJAMENTO — Casamento */}
          {casamento && (() => {
            const prazo = casamento.prazo || '2026-08-29';
            const dias = Math.ceil((new Date(prazo + 'T12:00:00') - new Date()) / 86400000);
            const alvo = Number(casamento.alvo) || 0;
            const pct = alvo > 0 ? Math.min(100, ((Number(casamento.guardado) || 0) / alvo) * 100) : 0;
            return (
              <button onClick={() => nav('/metas')}
                className="w-full text-left rounded-2xl p-5 border border-accent/40 bg-gradient-to-br from-surface-2 to-surface hover:border-accent transition">
                <div className="flex items-center justify-between">
                  <p className="text-accent text-sm flex items-center gap-1.5"><Heart size={15} /> Planejamento · Casamento</p>
                  <ChevronRight size={18} className="text-muted" />
                </div>
                {dias >= 0 && <p className="font-num text-2xl font-semibold mt-2">Faltam {dias} dias</p>}
                <p className="text-muted text-sm">{new Date(prazo + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                {alvo > 0 && (
                  <>
                    <div className="mt-3 h-2 rounded-full bg-line overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[0.7rem] text-muted mt-1.5">
                      <span>{formatarBRL(casamento.guardado)} guardado</span>
                      <span>alvo {formatarBRL(alvo)}</span>
                    </div>
                  </>
                )}
                <span className="inline-flex items-center gap-1 mt-4 text-sm text-accent">Abrir ambiente <ChevronRight size={15} /></span>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function Ring({ pct, size = 52, children }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4.5" stroke="var(--color-line)" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4.5" strokeLinecap="round"
          stroke="var(--color-accent)" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Stat({ Icone, cor, rotulo, valor }) {
  return (
    <Card className="px-3 py-3 md:px-4 md:py-4">
      <p className="text-muted text-[0.7rem] flex items-center gap-1 mb-1"><Icone size={13} className={cor} /> {rotulo}</p>
      <p className="font-num text-base md:text-xl font-semibold text-cream">{formatarBRL(valor)}</p>
    </Card>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-44 bg-surface rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface rounded-2xl" />)}</div>
      <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 bg-surface rounded-2xl" />)}</div>
      <div className="h-48 bg-surface rounded-2xl" />
    </div>
  );
}
