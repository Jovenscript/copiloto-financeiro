import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { useCofres } from '../hooks/useCofres';
import { useOrcamentos } from '../hooks/useOrcamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useLancamentos } from '../hooks/useLancamentos';
import { progressoCofre, aporteNecessario, statusCofre, statusOrcamento } from '../core/calculos';
import { novoCofre, novoOrcamento, novoRecorrente, novoParcelamento, categoriasDespesa, infoCategoria } from '../core/schema';
import Card from '../components/ui/Card';
import Money, { formatarBRL } from '../components/ui/Money';
import MetaWorkspace from '../components/MetaWorkspace';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm text-cream';

export default function Planejamento() {
  return (
    <div className="space-y-6">
      <div className="px-1">
        <p className="text-muted text-sm">Orçamento do mês — suas contas fixas, parcelas e o que pode gastar em cada categoria.</p>
      </div>
      <ContasFixasSection />
      <ParcelamentosSection />
      <OrcamentosSection />
    </div>
  );
}

export function CofreCard({ c, onAtualizar, onRemove, onAbrir }) {
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ nome: c.nome, alvo: c.alvo, aporteMensal: c.aporteMensal, guardado: c.guardado, devolver: c.devolver || 0 });
  const { pct, falta } = progressoCofre(c);
  const need = aporteNecessario(c);
  const status = statusCofre(c);

  async function salvarEdicao() {
    await onAtualizar(c.id, {
      nome: (form.nome || '').trim() || c.nome,
      alvo: Number(form.alvo) || c.alvo,
      aporteMensal: Number(form.aporteMensal) || c.aporteMensal,
      guardado: Number(form.guardado) || c.guardado,
      devolver: Number(form.devolver) || 0,
    });
    setEditar(false);
  }

  if (editar) {
    return (
      <Card className="space-y-2 border-accent/40">
        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do cofre" className={inputCls} />
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" value={form.alvo} onChange={(e) => setForm({ ...form, alvo: e.target.value })} placeholder="Alvo" className={inputCls} />
          <input type="number" inputMode="decimal" value={form.aporteMensal} onChange={(e) => setForm({ ...form, aporteMensal: e.target.value })} placeholder="Aporte/mês" className={inputCls} />
        </div>
        <input type="number" inputMode="decimal" value={form.guardado} onChange={(e) => setForm({ ...form, guardado: e.target.value })} placeholder="Guardado (dinheiro que você tem)" className={inputCls} />
        <input type="number" inputMode="decimal" value={form.devolver} onChange={(e) => setForm({ ...form, devolver: e.target.value })} placeholder="A devolver (ex: dinheiro dos pais)" className={inputCls} />
        <p className="text-muted text-[0.65rem] px-1">"A devolver" = quanto desse guardado é dívida (não conta como seu patrimônio).</p>
        <div className="flex gap-2">
          <button onClick={salvarEdicao} className="flex-1 bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ nome: c.nome, alvo: c.alvo, aporteMensal: c.aporteMensal, guardado: c.guardado, devolver: c.devolver || 0 }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm text-cream">Cancelar</button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <button onClick={() => setEditar(true)} className="w-full flex items-start justify-between text-left active:opacity-70 transition">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{c.icone}</span>
          <div>
            <p className="font-num text-lg leading-tight text-cream">{c.nome}</p>
            <p className="text-muted text-xs">{formatarBRL(c.guardado)} guardado de {formatarBRL(c.alvo)}</p>
          </div>
        </div>
        <span className="font-num text-accent text-lg">{pct.toFixed(0)}%</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-accent/8 border border-accent/25 rounded-xl px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase tracking-wider">Guardado</p>
          <p className="font-num text-xl text-accent">{formatarBRL(c.guardado)}</p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase tracking-wider">Falta</p>
          <p className="font-num text-xl text-negative">{formatarBRL(falta)}</p>
        </div>
      </div>

      <div className="h-1.5 bg-line rounded-full overflow-hidden">
        <motion.div className="h-full bg-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">faltam <strong className="text-cream">{formatarBRL(falta)}</strong></span>
        {need.mensal !== null && need.meses > 0 && (
          <span className="text-muted">guarde <strong className="text-cream">{formatarBRL(need.mensal)}</strong>/mês ({need.meses}m)</span>
        )}
      </div>

      {status && (
        <div className={`text-xs rounded-lg px-3 py-2 ${status.ok ? 'bg-positive/8 text-positive' : 'bg-negative/8 text-negative'}`}>
          {status.ok
            ? `No caminho — seu aporte de ${formatarBRL(status.planejado)} dá conta.`
            : `Atrasado — guardando ${formatarBRL(status.planejado)}, mas precisa de ${formatarBRL(status.necessario)}/mês.`}
        </div>
      )}

      <button onClick={onAbrir} className="w-full bg-surface-2 border border-line rounded-xl py-2 text-sm text-cream hover:border-accent active:scale-[0.99] transition">
        Abrir ambiente →
      </button>

      <div className="flex gap-2">
        <button onClick={() => setEditar(true)} className="flex-1 bg-accent/10 text-accent rounded-xl py-2 text-sm hover:bg-accent/15 transition">Editar</button>
        <button onClick={onRemove} className="text-muted hover:text-negative transition px-3 text-lg">×</button>
      </div>
    </Card>
  );
}

// ============================================================
// CONTAS FIXAS (recorrentes) — editável inline
// ============================================================
function ContasFixasSection() {
  const { recorrentes, adicionar, atualizar, remover } = useRecorrentes();
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: 'moradia', diaVencimento: '' });

  async function salvar() {
    if (!form.descricao || !form.valor) return;
    await adicionar(novoRecorrente(form));
    setForm({ descricao: '', valor: '', categoria: 'moradia', diaVencimento: '' });
    setAbrir(false);
  }

  const total = recorrentes.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  return (
    <div>
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <p className="font-num text-lg text-cream">Contas fixas</p>
          <p className="text-muted text-xs">{recorrentes.length} contas · {formatarBRL(total)}/mês · toque pra editar</p>
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm shrink-0 pl-2">{abrir ? 'cancelar' : '+ Nova'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-3 space-y-2 border-accent/40">
              <input placeholder="Nome (ex: Celesc)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputCls} />
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" placeholder="Valor" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={inputCls} />
                <input type="number" inputMode="numeric" min={1} max={31} placeholder="Dia vence" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} className={inputCls} />
              </div>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
                {categoriasDespesa().map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
              </select>
              <button onClick={salvar} className="w-full bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Adicionar conta fixa</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {recorrentes.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhuma conta fixa ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {recorrentes.map((r) => <ContaFixaCard key={r.id} r={r} onAtualizar={atualizar} onRemove={() => remover(r.id)} />)}
        </div>
      )}
    </div>
  );
}

function ContaFixaCard({ r, onAtualizar, onRemove }) {
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ descricao: r.descricao, valor: r.valor, categoria: r.categoria, diaVencimento: r.diaVencimento });
  const info = infoCategoria(r.categoria);

  async function salvarEdicao() {
    await onAtualizar(r.id, {
      descricao: (form.descricao || '').trim() || r.descricao,
      valor: Number(form.valor) || r.valor,
      categoria: form.categoria,
      diaVencimento: Math.min(31, Math.max(1, Number(form.diaVencimento) || r.diaVencimento)),
    });
    setEditar(false);
  }

  if (editar) {
    return (
      <Card className="space-y-2 border-accent/40">
        <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Nome" className={inputCls} />
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="Valor" className={inputCls} />
          <input type="number" inputMode="numeric" min={1} max={31} value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} placeholder="Dia vence" className={inputCls} />
        </div>
        <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
          {categoriasDespesa().map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={salvarEdicao} className="flex-1 bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ descricao: r.descricao, valor: r.valor, categoria: r.categoria, diaVencimento: r.diaVencimento }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm text-cream">Cancelar</button>
          <button onClick={onRemove} className="text-negative/70 hover:text-negative px-3 text-sm">Excluir</button>
        </div>
      </Card>
    );
  }

  return (
    <button onClick={() => setEditar(true)} className="text-left w-full">
      <Card className="hover:border-accent/40 active:scale-[0.99] transition">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-accent/8 grid place-items-center text-lg shrink-0">{info.icone}</span>
            <div className="min-w-0">
              <p className="text-cream text-sm font-medium truncate">{r.descricao}</p>
              <span className="inline-flex items-center gap-1 text-[0.7rem] text-accent bg-accent/8 rounded-full px-2 py-0.5 mt-0.5">
                vence dia {r.diaVencimento}
              </span>
            </div>
          </div>
          <p className="font-num text-cream shrink-0">{formatarBRL(r.valor)}</p>
        </div>
      </Card>
    </button>
  );
}

// ============================================================
// PARCELAMENTOS (cartão/financiamento)
// ============================================================
function ParcelamentosSection() {
  const { parcelamentos, adicionar, atualizar, remover } = useParcelamentos();
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ descricao: '', valorParcela: '', totalParcelas: '', parcelasPagas: '0', categoria: 'compras', diaVencimento: '' });

  async function salvar() {
    if (!form.descricao || !form.valorParcela || !form.totalParcelas) return;
    await adicionar(novoParcelamento(form));
    setForm({ descricao: '', valorParcela: '', totalParcelas: '', parcelasPagas: '0', categoria: 'compras', diaVencimento: '' });
    setAbrir(false);
  }

  const ativos = parcelamentos.filter((p) => (Number(p.parcelasPagas) || 0) < (Number(p.totalParcelas) || 1));
  const total = ativos.reduce((s, p) => s + (Number(p.valorParcela) || 0), 0);

  return (
    <div>
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <p className="font-num text-lg text-cream">Parcelamentos</p>
          <p className="text-muted text-xs">{ativos.length} ativos · {formatarBRL(total)}/mês</p>
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm shrink-0 pl-2">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-3 space-y-2 border-accent/40">
              <input placeholder="Nome (ex: Camargo)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputCls} />
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" placeholder="Valor da parcela" value={form.valorParcela} onChange={(e) => setForm({ ...form, valorParcela: e.target.value })} className={inputCls} />
                <input type="number" inputMode="numeric" min={1} max={31} placeholder="Dia vence" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <input type="number" inputMode="numeric" placeholder="Total de parcelas" value={form.totalParcelas} onChange={(e) => setForm({ ...form, totalParcelas: e.target.value })} className={inputCls} />
                <input type="number" inputMode="numeric" placeholder="Já pagas" value={form.parcelasPagas} onChange={(e) => setForm({ ...form, parcelasPagas: e.target.value })} className={inputCls} />
              </div>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
                {categoriasDespesa().map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
              </select>
              <button onClick={salvar} className="w-full bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Adicionar parcelamento</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {parcelamentos.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum parcelamento ativo.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {parcelamentos.map((p) => <ParcelamentoCard key={p.id} p={p} onAtualizar={atualizar} onRemove={() => remover(p.id)} />)}
        </div>
      )}
    </div>
  );
}

function ParcelamentoCard({ p, onAtualizar, onRemove }) {
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ descricao: p.descricao, valorParcela: p.valorParcela, totalParcelas: p.totalParcelas, parcelasPagas: p.parcelasPagas, categoria: p.categoria, diaVencimento: p.diaVencimento });
  const info = infoCategoria(p.categoria);
  const restantes = Math.max(0, (Number(p.totalParcelas) || 1) - (Number(p.parcelasPagas) || 0));
  const pct = Math.min(100, ((Number(p.parcelasPagas) || 0) / (Number(p.totalParcelas) || 1)) * 100);
  const quitado = restantes === 0;

  async function salvarEdicao() {
    await onAtualizar(p.id, {
      descricao: (form.descricao || '').trim() || p.descricao,
      valorParcela: Number(form.valorParcela) || p.valorParcela,
      totalParcelas: Math.max(1, Number(form.totalParcelas) || p.totalParcelas),
      parcelasPagas: Math.max(0, Number(form.parcelasPagas) || 0),
      categoria: form.categoria,
      diaVencimento: Math.min(31, Math.max(1, Number(form.diaVencimento) || p.diaVencimento)),
    });
    setEditar(false);
  }

  if (editar) {
    return (
      <Card className="space-y-2 border-accent/40">
        <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Nome" className={inputCls} />
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" value={form.valorParcela} onChange={(e) => setForm({ ...form, valorParcela: e.target.value })} placeholder="Valor parcela" className={inputCls} />
          <input type="number" inputMode="numeric" min={1} max={31} value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} placeholder="Dia vence" className={inputCls} />
        </div>
        <div className="flex gap-2">
          <input type="number" inputMode="numeric" value={form.totalParcelas} onChange={(e) => setForm({ ...form, totalParcelas: e.target.value })} placeholder="Total parcelas" className={inputCls} />
          <input type="number" inputMode="numeric" value={form.parcelasPagas} onChange={(e) => setForm({ ...form, parcelasPagas: e.target.value })} placeholder="Já pagas" className={inputCls} />
        </div>
        <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
          {categoriasDespesa().map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={salvarEdicao} className="flex-1 bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ descricao: p.descricao, valorParcela: p.valorParcela, totalParcelas: p.totalParcelas, parcelasPagas: p.parcelasPagas, categoria: p.categoria, diaVencimento: p.diaVencimento }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm text-cream">Cancelar</button>
          <button onClick={onRemove} className="text-negative/70 hover:text-negative px-3 text-sm">Excluir</button>
        </div>
      </Card>
    );
  }

  return (
    <button onClick={() => setEditar(true)} className="text-left w-full">
      <Card className={`hover:border-accent/40 active:scale-[0.99] transition ${quitado ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-accent/8 grid place-items-center text-lg shrink-0">{info.icone}</span>
            <div className="min-w-0">
              <p className="text-cream text-sm font-medium truncate">{p.descricao}</p>
              <span className="inline-flex items-center gap-1 text-[0.7rem] text-accent bg-accent/8 rounded-full px-2 py-0.5 mt-0.5">
                {quitado ? 'quitado' : `vence dia ${p.diaVencimento}`}
              </span>
            </div>
          </div>
          <p className="font-num text-cream shrink-0">{formatarBRL(p.valorParcela)}</p>
        </div>
        <div className="h-1.5 bg-line rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-muted text-[0.7rem] mt-1">{p.parcelasPagas || 0} de {p.totalParcelas} parcelas {!quitado && `· faltam ${restantes}`}</p>
      </Card>
    </button>
  );
}

// ============================================================
// ORÇAMENTOS DO MÊS — limites por finalidade, com nome livre.
// Cada gasto lançado no "+" apontando pro orçamento consome o saldo.
// ============================================================
function OrcamentosSection() {
  const { orcamentos, adicionar, atualizar, remover } = useOrcamentos();
  const { lancamentos } = useLancamentos();
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ nome: '', valorMensal: '', icone: '' });

  async function salvar() {
    if (!form.nome || !form.valorMensal) return;
    await adicionar(novoOrcamento(form));
    setForm({ nome: '', valorMensal: '', icone: '' });
    setAbrir(false);
  }

  const totalLimites = orcamentos.reduce((s, o) => s + (Number(o.valorMensal) || 0), 0);

  return (
    <div className="pt-2">
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <p className="font-num text-lg text-cream">Orçamentos do mês</p>
          <p className="text-muted text-xs">{orcamentos.length} orçamentos · {formatarBRL(totalLimites)} reservados · consome a cada gasto</p>
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm shrink-0 pl-2">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-3 space-y-2 border border-accent/40">
              <input placeholder="Nome (ex: Combustível do carro)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} />
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" placeholder="Limite mensal (ex: 400)" value={form.valorMensal} onChange={(e) => setForm({ ...form, valorMensal: e.target.value })} className={inputCls} />
                <input placeholder="Emoji (ex: ⛽)" maxLength={4} value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} className={`${inputCls} !w-28`} />
              </div>
              <button onClick={salvar} className="w-full bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Criar orçamento</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {orcamentos.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum orçamento. Crie "Combustível do carro", "Lazer"... e lance os gastos descontando deles.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {orcamentos.map((o) => <OrcamentoCard key={o.id} o={o} lancamentos={lancamentos} onAtualizar={atualizar} onRemove={() => remover(o.id)} />)}
        </div>
      )}
    </div>
  );
}

function OrcamentoCard({ o, lancamentos, onAtualizar, onRemove }) {
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ nome: o.nome, valorMensal: o.valorMensal, icone: o.icone });
  const s = statusOrcamento(o, lancamentos);

  async function salvarEdicao() {
    await onAtualizar(o.id, {
      nome: (form.nome || '').trim() || o.nome,
      valorMensal: Number(form.valorMensal) || o.valorMensal,
      icone: (form.icone || '').trim() || o.icone,
    });
    setEditar(false);
  }

  if (editar) {
    return (
      <Card className="space-y-2 border border-accent/40">
        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" className={inputCls} />
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" value={form.valorMensal} onChange={(e) => setForm({ ...form, valorMensal: e.target.value })} placeholder="Limite mensal" className={inputCls} />
          <input value={form.icone} maxLength={4} onChange={(e) => setForm({ ...form, icone: e.target.value })} placeholder="Emoji" className={`${inputCls} !w-28`} />
        </div>
        <div className="flex gap-2">
          <button onClick={salvarEdicao} className="flex-1 bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ nome: o.nome, valorMensal: o.valorMensal, icone: o.icone }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm text-cream">Cancelar</button>
          <button onClick={onRemove} className="text-negative/70 hover:text-negative px-3 text-sm">Excluir</button>
        </div>
      </Card>
    );
  }

  return (
    <button onClick={() => setEditar(true)} className="text-left w-full">
      <Card className="space-y-3 hover:border-accent/40 active:scale-[0.99] transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-accent/8 grid place-items-center text-lg shrink-0">{o.icone}</span>
            <div>
              <p className="text-cream text-sm font-semibold">{o.nome}</p>
              <p className="text-muted text-[0.7rem]">limite {formatarBRL(s.limite)}/mês</p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <span className={`font-num text-2xl ${s.estourou ? 'text-negative' : 'text-cream'}`}>{formatarBRL(Math.max(0, s.restante))}</span>
          <span className="text-muted text-xs mb-1">restante</span>
        </div>

        <div className="h-2 bg-line rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${s.estourou ? 'bg-negative' : s.pct > 85 ? 'bg-amber' : 'bg-accent'}`} style={{ width: `${s.pct}%` }} />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-muted">gastou {formatarBRL(s.gasto)}</span>
          <span className={s.estourou ? 'text-negative font-semibold' : 'text-muted'}>
            {s.estourou ? `estourou ${formatarBRL(-s.restante)}` : `${Math.round(s.pct)}% usado`}
          </span>
        </div>
      </Card>
    </button>
  );
}
