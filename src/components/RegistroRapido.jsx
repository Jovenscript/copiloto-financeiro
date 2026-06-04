import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLancamentos } from '../hooks/useLancamentos';
import { novoLancamento, categoriasDespesa, categoriasReceita, hojeISO } from '../core/schema';

// Botão flutuante (FAB) presente em todas as telas. Lançar em < 10s.
export default function RegistroRapido() {
  const { adicionar } = useLancamentos();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState('despesa');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('mercado');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const cats = tipo === 'receita' ? categoriasReceita() : categoriasDespesa();

  function trocarTipo(t) { setTipo(t); setCategoria(t === 'receita' ? 'salario' : 'mercado'); }

  async function salvar() {
    if (!valor || Number(valor) <= 0) return;
    setSalvando(true);
    try {
      await adicionar(novoLancamento({ tipo, valor, categoria, descricao, data: hojeISO(), pago: true }));
      setValor(''); setDescricao(''); setAberto(false);
    } finally { setSalvando(false); }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setAberto(true)}
        className="fixed z-40 right-5 bottom-24 max-w-xl w-14 h-14 rounded-full bg-accent text-bg text-3xl font-light shadow-lg shadow-accent/30 flex items-center justify-center active:scale-95 transition"
        style={{ right: 'max(1.25rem, calc(50vw - 320px + 1.25rem))' }}
        aria-label="Registro rápido"
      >
        +
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAberto(false)}
          >
            <motion.div
              className="w-full max-w-sm bg-surface border border-line rounded-3xl p-5"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-num text-xl mb-4">Registro rápido</p>

              <div className="grid grid-cols-2 gap-2 mb-3 bg-bg rounded-xl p-1">
                {['despesa', 'receita'].map((t) => (
                  <button key={t} onClick={() => trocarTipo(t)}
                    className={`py-2 rounded-lg text-sm font-medium transition ${tipo === t ? (t === 'despesa' ? 'bg-negative/20 text-negative' : 'bg-positive/20 text-positive') : 'text-muted'}`}>
                    {t === 'despesa' ? '− Despesa' : '+ Receita'}
                  </button>
                ))}
              </div>

              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-num text-lg">R$</span>
                <input type="number" inputMode="decimal" step="0.01" placeholder="0,00" autoFocus
                  value={valor} onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-surface-2 border border-line rounded-xl pl-12 pr-4 py-3 font-num text-2xl outline-none focus:border-accent transition" />
              </div>

              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 mb-3 outline-none focus:border-accent transition">
                {cats.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
              </select>

              <input type="text" placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 mb-4 outline-none focus:border-accent transition placeholder:text-muted/60" />

              <div className="flex gap-2">
                <button onClick={() => setAberto(false)} className="flex-1 py-3 rounded-xl border border-line text-muted hover:text-cream transition">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="flex-1 py-3 rounded-xl bg-accent text-bg font-semibold active:scale-[0.99] transition disabled:opacity-60">
                  {salvando ? '...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
