import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Receipt, Target, FileText, ChevronRight, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { useOrcamentos } from '../hooks/useOrcamentos';
import { chaveMes, panoramaMes, vencimentosProximos, contasVencidas, statusOrcamento, gastosPorCategoria, mesesAte } from '../core/calculos';
import { infoCategoria } from '../core/schema';
import { formatarBRL } from '../components/ui/Money';

// ============ INÍCIO — design "cockpit" aprovado no protótipo ============
// Hero navy (saldo + pista) → tiles sobrepostos → banner único de atenção →
// próximos pagamentos → orçamentos (carrossel) → rosca de categorias → meta.

const CORES_ROSCA = ['#2E5BFF', '#F6A723', '#18A067', '#8B5CF6', '#E23D4D', '#94A3B8'];

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const tick = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function Inicio() {
  const nav = useNavigate();
  const { lancamentos, carregando } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { cofres } = useCofres();
  const { orcamentos } = useOrcamentos();
  const ym = chaveMes();

  const pan = panoramaMes({ lancs: lancamentos, recorrentes, parcelamentos, cofres, ym });
  const saldoAnimado = useCountUp(pan.disponivel);

  if (carregando) return <Esqueleto />;

  const vencidas = contasVencidas({ recorrentes, parcelamentos });
  const proximas = vencimentosProximos({ recorrentes, parcelamentos, dias: 10 });
  const pctComprometido = pan.receitas > 0 ? Math.min(100, ((pan.despesas + pan.comprometido) / pan.receitas) * 100) : 0;
  const lista = [...vencidas.map((v) => ({ ...v, status: 'vencida' })), ...proximas.map((v) => ({ ...v, status: 'futura' }))].slice(0, 4);
  const categorias = gastosPorCategoria(lancamentos, ym).slice(0, 6);
  const totalCategorias = categorias.reduce((s, c) => s + c.total, 0);
  const metaDestaque = [...cofres].filter((c) => c.prazo).sort((a, b) => (mesesAte(a.prazo) ?? 999) - (mesesAte(b.prazo) ?? 999))[0] || cofres[0];

  return (
    <div className="-mx-5 md:-mx-8 -mt-4">
      {/* ===== HERO NAVY ===== */}
      <div className="relative overflow-hidden rounded-b-[28px] px-5 md:px-8 pt-2 pb-16" style={{ background: 'linear-gradient(160deg, var(--color-navy) 0%, var(--color-navy-2) 100%)' }}>
        <svg width="240" height="240" className="absolute -right-16 -top-16 opacity-[0.07]">
          {[60, 90, 120].map((r) => <circle key={r} cx="120" cy="120" r={r} stroke="#fff" fill="none" strokeWidth="1" />)}
        </svg>

        <div className="rise2 relative">
          <p className="text-white/55 text-xs uppercase tracking-[0.14em]">Disponível este mês</p>
          <p className={`font-num text-[42px] leading-tight ${pan.disponivel >= 0 ? 'text-white' : 'text-[#FF8B96]'}`}>
            {formatarBRL(saldoAnimado)}
          </p>
          {/* pista de comprometimento */}
          <div className="relative mt-3.5 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="runway h-full rounded-full" style={{ width: `${pctComprometido}%`, background: 'linear-gradient(90deg, var(--color-accent), #6C8CFF)' }} />
            {[25, 50, 75].map((m) => <span key={m} className="absolute top-0.5 bottom-0.5 w-px bg-white/25" style={{ left: `${m}%` }} />)}
          </div>
          <div className="flex justify-between text-white/55 text-[11.5px] mt-1.5">
            <span>{formatarBRL(pan.despesas + pan.comprometido)} comprometido</span>
            <span className="font-num font-medium">{Math.round(pctComprometido)}% da renda</span>
          </div>
        </div>
      </div>

      {/* ===== TILES sobrepostos ===== */}
      <div className="rise3 grid grid-cols-4 gap-2.5 px-5 md:px-8 -mt-10 relative z-10">
        {[
          { label: 'Lançar', Icone: Plus, rota: '/financas', destaque: true },
          { label: 'Pagar', Icone: Receipt, rota: '/financas' },
          { label: 'Metas', Icone: Target, rota: '/metas' },
          { label: 'Extrato', Icone: FileText, rota: '/perfil' },
        ].map(({ label, Icone, rota, destaque }) => (
          <button key={label} onClick={() => nav(rota)}
            className={`shadow-tile rounded-2xl pt-3.5 pb-3 flex flex-col items-center gap-1.5 transition active:scale-[0.97] ${destaque ? 'bg-accent text-white' : 'bg-surface text-cream'}`}>
            <Icone size={20} strokeWidth={2.2} />
            <span className="text-[11.5px] font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <div className="px-5 md:px-8 pt-4 flex flex-col gap-3.5">

        {/* ===== BANNER ÚNICO DE ATENÇÃO ===== */}
        <BannerAtencao vencidas={vencidas} proximas={proximas} onClick={() => nav('/financas')} />

        {/* ===== PRÓXIMOS PAGAMENTOS ===== */}
        {lista.length > 0 && (
          <section className="bg-surface shadow-card rounded-[18px] p-4.5 px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-base text-cream">Próximos pagamentos</h3>
              <button onClick={() => nav('/financas')} className="text-accent text-xs font-semibold">ver todos</button>
            </div>
            {lista.map((item, i) => {
              const info = infoCategoria(item.categoria);
              const dias = Math.round((new Date(item.data + 'T12:00:00') - new Date()) / 86400000);
              const atrasada = item.status === 'vencida';
              return (
                <div key={i} className={`flex items-center gap-3 py-2.5 ${i ? 'border-t border-line' : ''}`}>
                  <span className={`w-9 h-9 rounded-xl grid place-items-center text-base shrink-0 ${atrasada ? 'bg-negative/10' : 'bg-accent/8'}`}>{info.icone}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cream truncate">{item.descricao}</p>
                    <p className={`text-xs ${atrasada || dias <= 1 ? 'text-negative' : 'text-muted'}`}>
                      {atrasada ? `venceu há ${Math.abs(dias)}d` : dias <= 0 ? 'vence hoje' : dias === 1 ? 'vence amanhã' : `vence em ${dias}d`}
                    </p>
                  </div>
                  <span className="font-num text-sm text-cream shrink-0">{formatarBRL(item.valor)}</span>
                </div>
              );
            })}
          </section>
        )}

        {/* ===== ORÇAMENTOS (carrossel) ===== */}
        {orcamentos.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between px-0.5 mb-2.5">
              <h3 className="font-bold text-base text-cream">Orçamentos do mês</h3>
              <button onClick={() => nav('/financas')} className="text-accent text-xs font-semibold">gerenciar</button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-3">
              {orcamentos.map((o) => {
                const s = statusOrcamento(o, lancamentos);
                return (
                  <div key={o.id} className="min-w-[148px] bg-surface shadow-card rounded-2xl p-3.5 shrink-0">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-[30px] h-[30px] rounded-[9px] bg-accent/8 grid place-items-center text-sm">{o.icone}</span>
                      <span className="text-[13px] font-semibold text-cream truncate">{o.nome}</span>
                    </div>
                    <p className={`font-num text-[19px] ${s.estourou ? 'text-negative' : 'text-cream'}`}>{formatarBRL(Math.max(0, s.restante))}</p>
                    <p className="text-[11px] text-muted mb-2">de {formatarBRL(s.limite)}</p>
                    <div className="h-[5px] bg-line rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.pct > 85 ? 'bg-negative' : 'bg-accent'}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== ROSCA — pra onde o dinheiro vai ===== */}
        <section className="bg-surface shadow-card rounded-[18px] px-5 py-4">
          <h3 className="font-bold text-base text-cream mb-1">Pra onde o dinheiro vai</h3>
          {categorias.length === 0 ? (
            <p className="text-muted text-sm py-3">Lance seus gastos no "+" e o mapa de categorias aparece aqui.</p>
          ) : (
            <div className="flex items-center gap-3">
              <Rosca dados={categorias} total={totalCategorias} />
              <div className="flex-1">
                {categorias.map((c, i) => {
                  const info = infoCategoria(c.categoria);
                  return (
                    <div key={c.categoria} className="flex items-center gap-2 py-[3.5px]">
                      <span className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ background: CORES_ROSCA[i % CORES_ROSCA.length] }} />
                      <span className="text-[12.5px] text-cream flex-1 truncate">{info.label}</span>
                      <span className="font-num text-[12.5px] text-cream">{formatarBRL(c.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ===== META EM DESTAQUE ===== */}
        {metaDestaque && <MetaDestaque cofre={metaDestaque} onClick={() => nav('/metas')} />}
      </div>
    </div>
  );
}

// Rosca em SVG puro — sem dependência nova (recharts pesaria o APK à toa).
function Rosca({ dados, total }) {
  const R = 52, r = 36, cx = 65, cy = 65;
  let acc = 0;
  const arcos = dados.map((d, i) => {
    const frac = total > 0 ? d.total / total : 0;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2 - 0.03; // gap
    const grande = a1 - a0 > Math.PI ? 1 : 0;
    const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)];
    const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
    const q1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    const q0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
    return (
      <path key={i}
        d={`M ${p0} A ${R} ${R} 0 ${grande} 1 ${p1} L ${q1} A ${r} ${r} 0 ${grande} 0 ${q0} Z`}
        fill={CORES_ROSCA[i % CORES_ROSCA.length]} />
    );
  });
  return (
    <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
      <svg width="130" height="130">{arcos}</svg>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <p className="text-[10px] text-muted">total</p>
          <p className="font-num text-[13px] text-cream">{formatarBRL(total)}</p>
        </div>
      </div>
    </div>
  );
}

function BannerAtencao({ vencidas, proximas, onClick }) {
  if (vencidas.length > 0) {
    const total = vencidas.reduce((s, v) => s + v.valor, 0);
    return (
      <button onClick={onClick} className="flex items-center gap-3 bg-[#FDECEE] border border-[#F5C6CC] rounded-[14px] px-3.5 py-3 text-left">
        <span className="w-[34px] h-[34px] rounded-[10px] bg-[#FADDE0] grid place-items-center shrink-0"><AlertCircle size={17} className="text-negative" /></span>
        <span className="text-[13.5px] text-cream flex-1"><strong className="text-negative">{vencidas.length} {vencidas.length === 1 ? 'conta vencida' : 'contas vencidas'}</strong> · {formatarBRL(total)}</span>
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>
    );
  }
  const p = proximas[0];
  if (p) {
    const dias = Math.round((new Date(p.data + 'T12:00:00') - new Date()) / 86400000);
    return (
      <button onClick={onClick} className="flex items-center gap-3 bg-[#FFF7E8] border border-[#F2DCAE] rounded-[14px] px-3.5 py-3 text-left">
        <span className="w-[34px] h-[34px] rounded-[10px] bg-[#FCEBC6] grid place-items-center shrink-0"><AlertCircle size={17} className="text-amber" /></span>
        <span className="text-[13.5px] text-cream flex-1"><strong>{p.descricao}</strong> {dias <= 0 ? 'vence hoje' : dias === 1 ? 'vence amanhã' : `vence em ${dias} dias`} · {formatarBRL(p.valor)}</span>
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-positive/8 border border-positive/25 rounded-[14px] px-3.5 py-3">
      <CheckCircle2 size={18} className="text-positive shrink-0" />
      <span className="text-[13.5px] text-cream">Tudo em dia. Nada vencendo nos próximos 10 dias.</span>
    </div>
  );
}

function MetaDestaque({ cofre, onClick }) {
  const alvo = Number(cofre.alvo) || 0;
  const pct = alvo > 0 ? Math.min(100, ((Number(cofre.guardado) || 0) / alvo) * 100) : 0;
  const dias = cofre.prazo ? Math.max(0, Math.ceil((new Date(cofre.prazo + 'T12:00:00') - new Date()) / 86400000)) : null;
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 bg-surface shadow-card rounded-[18px] p-4 text-left mb-2">
      <span className="w-[52px] h-[52px] rounded-2xl bg-[#FDEDF0] grid place-items-center shrink-0 text-2xl">
        {cofre.icone || <Heart size={22} className="text-negative" fill="currentColor" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-bold text-cream truncate">{cofre.nome}{dias != null && ` · ${dias} dias`}</p>
        <p className="text-xs text-muted mt-0.5 mb-2">{formatarBRL(cofre.guardado)} de {formatarBRL(alvo)} · {Math.round(pct)}%</p>
        <div className="h-1.5 bg-line rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #E23D4D, #F2708A)' }} />
        </div>
      </div>
      <ChevronRight size={17} className="text-muted shrink-0" />
    </button>
  );
}

function Esqueleto() {
  return (
    <div className="-mx-5 md:-mx-8 -mt-4 animate-pulse">
      <div className="h-52 rounded-b-[28px]" style={{ background: 'var(--color-navy)' }} />
      <div className="px-5 md:px-8 -mt-10 grid grid-cols-4 gap-2.5">{[0,1,2,3].map((i) => <div key={i} className="h-[70px] bg-surface rounded-2xl shadow-tile" />)}</div>
      <div className="px-5 md:px-8 pt-4 space-y-3.5">
        <div className="h-14 bg-surface rounded-[14px]" />
        <div className="h-44 bg-surface rounded-[18px]" />
      </div>
    </div>
  );
}
