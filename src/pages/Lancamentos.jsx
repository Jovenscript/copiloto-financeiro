import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useCartoes } from '../hooks/useCartoes';
import { novoLancamento, categoriasDespesa, categoriasReceita, infoCategoria, hojeISO } from '../core/schema';
import Card from '../components/ui/Card';
import Money from '../components/ui/Money';
import ImportarPlanilha from '../components/ImportarPlanilha';

export default function Lancamentos() {
  const { lancamentos, adicionar, atualizar, remover, carregando } = useLancamentos();
  const { cartoes } = useCartoes();

  const [importAberto, setImportAberto] = useState(false);
  const [tipo, setTipo] = useState('despesa');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('mercado');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(hojeISO());
  const [cartaoId, setCartaoId] = useState('');
  const [salvando, setSalvando] = useState(false);

  const cats = tipo === 'receita' ? categoriasReceita() : categoriasDespesa();

  async function salvar(e) {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) return;
    setSalvando(true);
    try {
      await adicionar(novoLancamento({ tipo, valor, categoria, descricao, data, pago: true, cartaoId: tipo === 'despesa' ? cartaoId : null }));
      setValor('');
      setDescricao('');
    } finally {
      setSalvando(false);
    }
  }

  // troca a categoria default ao alternar tipo
  function trocarTipo(t) {
    setTipo(t);
    setCategoria(t === 'receita' ? 'salario' : 'mercado');
  }

  return (
    <div className="space-y-6">
      {/* IMPORTAR PLANILHA */}
      <button onClick={() => setImportAberto(true)}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-line rounded-2xl py-3 text-sm text-accent hover:border-accent transition">
        📥 Importar planilha do mês
      </button>
      <ImportarPlanilha aberto={importAberto} onFechar={() => setImportAberto(false)} />

      {/* FORM */}
      <Card>
        {/* toggle receita/despesa */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-bg rounded-xl p-1">
          {['despesa', 'receita'].map((t) => (
            <button
              key={t}
              onClick={() => trocarTipo(t)}
              className={`py-2 rounded-lg text-sm font-medium capitalize transition ${
                tipo === t
                  ? t === 'despesa' ? 'bg-negative/20 text-negative' : 'bg-positive/20 text-positive'
                  : 'text-muted'
              }`}
            >
              {t === 'despesa' ? '− Despesa' : '+ Receita'}
            </button>
          ))}
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-num text-lg">R$</span>
            <input
              type="number" inputMode="decimal" step="0.01" placeholder="0,00"
              value={valor} onChange={(e) => setValor(e.target.value)}
              className="w-full bg-surface-2 border border-line rounded-xl pl-12 pr-4 py-3 font-num text-2xl outline-none focus:border-accent transition"
              required
            />
          </div>

          <select
            value={categoria} onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 outline-none focus:border-accent transition"
          >
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.icone} {c.label}</option>
            ))}
          </select>

          <input
            type="text" placeholder="Descrição (ex: mercado da semana)"
            value={descricao} onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 outline-none focus:border-accent transition placeholder:text-muted/60"
          />

          <input
            type="date" value={data} onChange={(e) => setData(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 outline-none focus:border-accent transition text-cream"
          />

          {tipo === 'despesa' && cartoes.length > 0 && (
            <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)}
              className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 outline-none focus:border-accent transition text-cream">
              <option value="">💵 Sem cartão (dinheiro/débito)</option>
              {cartoes.map((c) => <option key={c.id} value={c.id}>💳 {c.nome}</option>)}
            </select>
          )}

          <button
            type="submit" disabled={salvando}
            className="w-full bg-accent text-bg font-semibold rounded-xl py-3 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
        </form>
      </Card>

      {/* LISTA */}
      <div>
        <p className="font-num text-lg mb-3 px-1">Últimos lançamentos</p>
        {carregando ? (
          <p className="text-muted text-sm px-1">Carregando...</p>
        ) : lancamentos.length === 0 ? (
          <p className="text-muted text-sm px-1">Nenhum lançamento ainda. Adicione o primeiro acima.</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {lancamentos.slice(0, 50).map((l) => (
                <LinhaLancamento key={l.id} l={l} onAtualizar={atualizar} onRemover={() => remover(l.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function formatarData(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}`;
}

// Linha da lista — toca pra editar TUDO inline (valor, descrição, categoria, data, tipo).
function LinhaLancamento({ l, onAtualizar, onRemover }) {
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ valor: l.valor, descricao: l.descricao, categoria: l.categoria, data: l.data, tipo: l.tipo });
  const info = infoCategoria(l.categoria);
  const cats = form.tipo === 'receita' ? categoriasReceita() : categoriasDespesa();

  async function salvar() {
    await onAtualizar(l.id, {
      valor: Number(form.valor) || l.valor,
      descricao: (form.descricao || '').trim() || l.descricao,
      categoria: form.categoria,
      data: form.data || l.data,
      tipo: form.tipo,
    });
    setEditar(false);
  }

  if (editar) {
    const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm text-cream';
    return (
      <motion.div layout className="bg-surface border border-accent/40 rounded-2xl p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 bg-bg rounded-xl p-1">
          {['despesa', 'receita'].map((t) => (
            <button key={t} onClick={() => setForm({ ...form, tipo: t })}
              className={`py-1.5 rounded-lg text-xs font-semibold transition ${form.tipo === t ? (t === 'despesa' ? 'bg-negative/15 text-negative' : 'bg-positive/15 text-positive') : 'text-muted'}`}>
              {t === 'despesa' ? '− Despesa' : '+ Receita'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="Valor" className={inputCls} />
          <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inputCls} />
        </div>
        <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição" className={inputCls} />
        <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={salvar} className="flex-1 bg-accent text-white font-semibold rounded-xl py-2.5 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ valor: l.valor, descricao: l.descricao, categoria: l.categoria, data: l.data, tipo: l.tipo }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm text-cream">Cancelar</button>
          <button onClick={onRemover} className="text-negative/70 hover:text-negative px-2 text-sm">Excluir</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="group flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3">
      <button onClick={() => setEditar(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <span className="text-xl">{info.icone}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm text-cream">{l.descricao}</p>
          <p className="text-muted text-xs">{formatarData(l.data)} · {info.label}</p>
        </div>
      </button>
      <Money valor={l.tipo === 'receita' ? l.valor : -l.valor} colorir className="text-sm" />
      <button onClick={onRemover} className="text-muted/40 hover:text-negative transition text-lg leading-none px-1" title="Remover">×</button>
    </motion.div>
  );
}
