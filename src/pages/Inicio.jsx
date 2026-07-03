import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, ChevronRight, Heart } from 'lucide-react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { chaveMes, panoramaMes, vencimentosProximos, contasVencidas, progressoCofre, mesesAte } from '../core/calculos';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

// Regra de hierarquia desta tela (teste dos 3 segundos):
// 1. Saldo disponível — a ÚNICA coisa gigante na tela.
// 2. UM banner de atenção — o item mais urgente, e só ele. Sem competir com o saldo.
// 3. Próximos pagamentos — lista curta (3 no máx), cor conta a história (vencida/hoje/depois).
// 4. UMA meta em destaque — a mais próxima do prazo. As outras ficam a 1 toque, não na tela.
export default function Inicio() {
  const nav = useNavigate();
  const { lancamentos, carregando } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { cofres } = useCofres();
  const ym = chaveMes();

  if (carregando) return <Esqueleto />;

  const pan = panoramaMes({ lancs: lancamentos, recorrentes, parcelamentos, cofres, ym });
  const vencidas = contasVencidas({ recorrentes, parcelamentos });
  const proximas = vencimentosProximos({ recorrentes, parcelamentos, dias: 10 });
  const positivo = pan.disponivel >= 0;
  const pctGasto = pan.receitas > 0 ? Math.min(100, ((pan.despesas + pan.comprometido) / pan.receitas) * 100) : 0;

  const lista = [...vencidas.map((v) => ({ ...v, status: 'vencida' })), ...proximas.map((v) => ({ ...v, status: 'futura' }))].slice(0, 3);

  const metaDestaque = [...cofres].filter((c) => c.prazo).sort((a, b) => (mesesAte(a.prazo) ?? 999) - (mesesAte(b.prazo) ?? 999))[0] || cofres[0];

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden bg-gradient-to-br from-surface-2 to-surface py-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent/10 blur-2xl" />
        <p className="text-muted text-xs uppercase tracking-[0.2em] mb-1">Disponível este mês</p>
        <div className={`font-num glow text-5xl md:text-6xl font-semibold tracking-tight ${positivo ? 'text-positive' : 'text-negative'}`}>
          {formatarBRL(pan.disponivel)}
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-line overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pctGasto}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent" />
        </div>
        <p className="text-muted text-xs mt-1.5">{formatarBRL(pan.despesas + pan.comprometido)} comprometido de {formatarBRL(pan.receitas)}</p>
      </Card>

      <BannerAtencao vencidas={vencidas} proximas={proximas} onClick={() => nav('/financas')} />

      {lista.length > 0 && (
        <Card className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="font-num text-lg font-semibold">Próximos pagamentos</p>
            <button onClick={() => nav('/financas')} className="text-accent text-xs flex items-center gap-0.5">todos <ChevronRight size={13} /></button>
          </div>
          {lista.map((item, i) => (
            <LinhaPagamento key={i} item={item} />
          ))}
        </Card>
      )}

      {metaDestaque && <MetaDestaque cofre={metaDestaque} onClick={() => nav('/metas')} />}
    </div>
  );
}

function BannerAtencao({ vencidas, proximas, onClick }) {
  if (vencidas.length > 0) {
    const total = vencidas.reduce((s, v) => s + v.valor, 0);
    return (
      <button onClick={onClick} className="w-full flex items-center gap-3 bg-negative/10 border border-negative/30 rounded-2xl px-4 py-3 text-left">
        <AlertCircle size={20} className="text-negative shrink-0" />
        <span className="text-sm text-cream flex-1">
          <strong className="text-negative">{vencidas.length} {vencidas.length === 1 ? 'conta vencida' : 'contas vencidas'}</strong> · {formatarBRL(total)}
        </span>
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>
    );
  }
  const proxima = proximas[0];
  if (proxima) {
    const dias = Math.round((new Date(proxima.data + 'T12:00:00') - new Date()) / 86400000);
    const urgente = dias <= 1;
    return (
      <button onClick={onClick} className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left border ${urgente ? 'bg-negative/10 border-negative/30' : 'bg-surface border-line'}`}>
        <Clock size={20} className={urgente ? 'text-negative shrink-0' : 'text-accent shrink-0'} />
        <span className="text-sm text-cream flex-1">
          <strong>{proxima.descricao}</strong> {dias <= 0 ? 'vence hoje' : dias === 1 ? 'vence amanhã' : `vence em ${dias} dias`} · {formatarBRL(proxima.valor)}
        </span>
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>
    );
  }
  return (
    <div className="w-full flex items-center gap-3 bg-positive/10 border border-positive/25 rounded-2xl px-4 py-3">
      <CheckCircle2 size={20} className="text-positive shrink-0" />
      <span className="text-sm text-cream">Tudo em dia. Nada vencendo nos próximos 10 dias. 🎉</span>
    </div>
  );
}

function LinhaPagamento({ item }) {
  const dias = Math.round((new Date(item.data + 'T12:00:00') - new Date()) / 86400000);
  const cor = item.status === 'vencida' ? 'text-negative' : dias <= 1 ? 'text-negative' : 'text-muted';
  const legenda = item.status === 'vencida' ? `venceu há ${Math.abs(dias)}d` : dias <= 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias}d`;
  return (
    <div className="flex items-center justify-between py-2 border-t border-line/60 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm text-cream truncate">{item.descricao}</p>
        <p className={`text-[0.7rem] ${cor}`}>{legenda}</p>
      </div>
      <span className="font-num text-sm text-cream shrink-0 pl-2">{formatarBRL(item.valor)}</span>
    </div>
  );
}

function MetaDestaque({ cofre, onClick }) {
  const { pct } = progressoCofre(cofre);
  const meses = mesesAte(cofre.prazo);
  return (
    <button onClick={onClick} className="w-full text-left rounded-2xl p-4 border border-accent/30 bg-gradient-to-br from-surface-2 to-surface">
      <div className="flex items-center justify-between mb-2">
        <p className="text-accent text-xs flex items-center gap-1.5"><Heart size={13} /> {cofre.nome}</p>
        <ChevronRight size={15} className="text-muted" />
      </div>
      <div className="flex items-end justify-between mb-1.5">
        <span className="font-num text-xl font-semibold text-cream">{formatarBRL(cofre.guardado)}</span>
        <span className="text-muted text-xs">{Math.round(pct)}% · {meses != null ? `${meses}m restantes` : `de ${formatarBRL(cofre.alvo)}`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-line overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 bg-surface rounded-2xl" />
      <div className="h-14 bg-surface rounded-2xl" />
      <div className="h-40 bg-surface rounded-2xl" />
      <div className="h-24 bg-surface rounded-2xl" />
    </div>
  );
}
