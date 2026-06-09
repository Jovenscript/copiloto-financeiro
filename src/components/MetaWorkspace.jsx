import { useState } from 'react';
import { motion } from 'motion/react';
import { useFornecedores } from '../hooks/useFornecedores';
import { useConvidados } from '../hooks/useConvidados';
import { novoFornecedor, novoConvidado } from '../core/metas';
import { formatarBRL } from './ui/Money';
import Card from './ui/Card';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm text-cream';

export default function MetaWorkspace({ cofre, onFechar }) {
  const forn = useFornecedores();
  const conv = useConvidados();

  const fornecedores = forn.fornecedores.filter((f) => f.metaId === cofre.id);
  const convidados = conv.convidados.filter((c) => c.metaId === cofre.id);

  const custoTotal = fornecedores.reduce((s, f) => s + (Number(f.valorTotal) || 0), 0);
  const pago = fornecedores.reduce((s, f) => s + (Number(f.valorPago) || 0), 0);
  const falta = custoTotal - pago;
  const guardado = Number(cofre.guardado) || 0;
  const cobre = guardado >= falta;
  const confirmados = convidados.filter((c) => c.confirmado).length;

  return (
    <motion.div className="fixed inset-0 z-50 bg-bg overflow-y-auto"
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
      <div className="max-w-xl mx-auto px-5 pt-6 pb-24 space-y-5">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button onClick={onFechar} className="text-muted hover:text-cream p-1 -ml-1 text-2xl leading-none">←</button>
          <span className="text-3xl">{cofre.icone}</span>
          <div>
            <h1 className="font-num text-2xl font-semibold leading-tight">{cofre.nome}</h1>
            <p className="text-muted text-xs">ambiente da meta</p>
          </div>
        </div>

        {/* RESUMO — conversa com o resto */}
        <Card className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-muted text-[0.65rem] uppercase tracking-wide">Custo total</p>
              <p className="font-num text-lg">{formatarBRL(custoTotal)}</p>
            </div>
            <div>
              <p className="text-muted text-[0.65rem] uppercase tracking-wide">Já pago</p>
              <p className="font-num text-lg text-positive">{formatarBRL(pago)}</p>
            </div>
            <div>
              <p className="text-muted text-[0.65rem] uppercase tracking-wide">Falta pagar</p>
              <p className="font-num text-lg text-negative">{formatarBRL(falta)}</p>
            </div>
          </div>
          <div className={`rounded-xl px-3 py-2.5 text-sm ${cobre ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
            {falta <= 0
              ? '🎉 Tudo pago! Nada pendente.'
              : cobre
                ? `✓ Você tem ${formatarBRL(guardado)} guardado — cobre os ${formatarBRL(falta)} que faltam.`
                : `⚠ Guardado ${formatarBRL(guardado)} · faltam ${formatarBRL(falta)}. Faltam ${formatarBRL(falta - guardado)} pra cobrir.`}
          </div>
        </Card>

        {/* FORNECEDORES */}
        <SecaoFornecedores forn={forn} fornecedores={fornecedores} metaId={cofre.id} />

        {/* CONVIDADOS */}
        <SecaoConvidados conv={conv} convidados={convidados} metaId={cofre.id} total={convidados.length} confirmados={confirmados} />
      </div>
    </motion.div>
  );
}

// ---- Fornecedores ----
function SecaoFornecedores({ forn, fornecedores, metaId }) {
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ nome: '', categoria: '', valorTotal: '', valorPago: '' });

  async function salvar() {
    if (!form.nome || !form.valorTotal) return;
    await forn.adicionar(novoFornecedor({ ...form, metaId }));
    setForm({ nome: '', categoria: '', valorTotal: '', valorPago: '' });
    setAbrir(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="font-num text-lg">🏢 Fornecedores</p>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      {abrir && (
        <Card className="mb-3 space-y-2">
          <input placeholder="Nome (ex: Buffet do João)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} />
          <input placeholder="Categoria (buffet, foto, decoração...)" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls} />
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" placeholder="Valor total" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: e.target.value })} className={inputCls} />
            <input type="number" inputMode="decimal" placeholder="Já pago" value={form.valorPago} onChange={(e) => setForm({ ...form, valorPago: e.target.value })} className={inputCls} />
          </div>
          <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Adicionar fornecedor</button>
        </Card>
      )}

      {fornecedores.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum fornecedor ainda. Adicione buffet, fotografia, decoração...</p>
      ) : (
        <div className="space-y-2">
          {fornecedores.map((f) => <FornecedorCard key={f.id} f={f} forn={forn} />)}
        </div>
      )}
    </div>
  );
}

function FornecedorCard({ f, forn }) {
  const [pagar, setPagar] = useState(false);
  const [valor, setValor] = useState('');
  const total = Number(f.valorTotal) || 0;
  const pago = Number(f.valorPago) || 0;
  const falta = total - pago;
  const pct = total > 0 ? Math.min(100, (pago / total) * 100) : 0;
  const quitado = falta <= 0;

  async function registrar() {
    const v = Number(valor) || 0;
    if (v <= 0) return;
    await forn.atualizar(f.id, { valorPago: pago + v });
    setValor(''); setPagar(false);
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm">{f.nome}</p>
          {f.categoria && <p className="text-muted text-xs">{f.categoria}</p>}
        </div>
        <button onClick={() => forn.remover(f.id)} className="text-muted/40 hover:text-negative text-lg leading-none">×</button>
      </div>
      <div className="h-2 bg-bg rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${quitado ? 'bg-positive' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">pago {formatarBRL(pago)} de {formatarBRL(total)}</span>
        {quitado ? <span className="text-positive">✓ quitado</span> : <span className="text-negative">falta {formatarBRL(falta)}</span>}
      </div>
      {!quitado && (
        pagar ? (
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" autoFocus placeholder="Valor do pagamento" value={valor} onChange={(e) => setValor(e.target.value)} className={inputCls} />
            <button onClick={registrar} className="bg-accent text-bg font-semibold rounded-xl px-4 text-sm">OK</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setPagar(true)} className="flex-1 bg-accent/15 text-accent rounded-xl py-2 text-sm hover:bg-accent/25 transition">+ Registrar pagamento</button>
            <button onClick={() => forn.atualizar(f.id, { valorPago: total })} className="text-positive bg-positive/15 rounded-xl px-3 text-sm hover:bg-positive/25 transition" title="Quitar">✓</button>
          </div>
        )
      )}
    </Card>
  );
}

// ---- Convidados ----
function SecaoConvidados({ conv, convidados, metaId, total, confirmados }) {
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ nome: '', grupo: '' });

  async function salvar() {
    if (!form.nome) return;
    await conv.adicionar(novoConvidado({ ...form, metaId, confirmado: false }));
    setForm({ nome: '', grupo: '' });
    setAbrir(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <p className="font-num text-lg">👥 Convidados</p>
          {total > 0 && <p className="text-muted text-xs">{confirmados} confirmados de {total}</p>}
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      {abrir && (
        <Card className="mb-3 space-y-2">
          <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} />
          <input placeholder="Grupo (família, amigos, trabalho...)" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} className={inputCls} />
          <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Adicionar convidado</button>
        </Card>
      )}

      {convidados.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum convidado ainda.</p>
      ) : (
        <div className="space-y-2">
          {convidados.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-2.5">
              <button onClick={() => conv.atualizar(c.id, { confirmado: !c.confirmado })}
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition text-sm font-bold ${c.confirmado ? 'bg-positive border-positive text-bg' : 'border-line text-transparent'}`}>
                ✓
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.nome}</p>
                {c.grupo && <p className="text-muted text-xs">{c.grupo}</p>}
              </div>
              <button onClick={() => conv.remover(c.id)} className="text-muted/40 hover:text-negative text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
