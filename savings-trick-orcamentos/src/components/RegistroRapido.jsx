import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useOrcamentos } from '../hooks/useOrcamentos';
import { statusOrcamento } from '../core/calculos';
import { novoLancamento, categoriasDespesa, categoriasReceita, hojeISO } from '../core/schema';
import { formatarBRL } from './ui/Money';

// FAB global. Despesa pode descontar de um Orçamento (Combustível do carro,
// Lazer...). REGRA: se o valor passa do que resta no orçamento, o app TRAVA
// e avisa — aí o gasto sai do saldo geral (desmarcando o orçamento).
export default function RegistroRapido() {
  const { adicionar, lancamentos } = useLancamentos();
  const { orcamentos } = useOrcamentos();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState('despesa');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('mercado');
  const [orcamentoId, setOrcamentoId] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const cats = tipo === 'receita' ? categoriasReceita() : categoriasDespesa();
  const orcSelecionado = orcamentos.find((o) => o.id === orcamentoId) || null;
  const statusSel = orcSelecionado ? statusOrcamento(orcSelecionado, lancamentos) : null;
  const insuficiente = !!(statusSel && Number(valor) > 0 && Number(valor) > statusSel.restante);

  function trocarTipo(t) { setTipo(t); setCategoria(t === 'receita' ? 'salario' : 'mercado'); setOrcamentoId(null); setErro(''); }

  async function salvar() {
    if (!valor || Number(valor) <= 0) return;
    // TRAVA: orçamento sem saldo suficiente não deixa salvar
    if (insuficiente) {
      setErro(`Saldo insuficiente em "${orcSelecionado.nome}" — resta ${formatarBRL(Math.max(0, statusSel.restante))}. Toque em "Usar saldo geral" pra lançar fora do orçamento.`);
      return;
    }
    setSalvando(true);
    try {
      await adicionar(novoLancamento({ tipo, valor, categoria, descricao, orcamentoId: tipo === 'despesa' ? orcamentoId : null, data: hojeISO(), pago: true }));
      setValor(''); setDescricao(''); setOrcamentoId(null); setErro(''); setAberto(false);
    } finally { setSalvando(false); }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="fixed z-40 right-5 bottom-24 max-w-xl w-14 h-14 rounded-full bg-accent text-white shadow-tile flex items-center justify-center active:scale-95 transition"
        style={{ right: 'max(1.25rem, calc(50vw - 320px + 1.25rem))' }}
        aria-label="Registro rápido"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAberto(false)}
          >
            <motion.div
              className="w-full max-w-sm bg-surface rounded-3xl p-5 shadow-tile"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-num text-xl mb-4 text-cream">Registro rápido</p>

              <div className="grid grid-cols-2 gap-2 mb-3 bg-bg rounded-xl p-1">
                {['despesa', 'receita'].map((t) => (
                  <button key={t} onClick={() => trocarTipo(t)}
                    className={`py-2 rounded-lg text-sm font-semibold transition ${tipo === t ? (t === 'despesa' ? 'bg-negative/15 text-negative' : 'bg-positive/15 text-positive') : 'text-muted'}`}>
                    {t === 'despesa' ? '− Despesa' : '+ Receita'}
                  </button>
                ))}
              </div>

              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-num text-lg">R$</span>
                <input type="number" inputMode="decimal" step="0.01" placeholder="0,00" autoFocus
                  value={valor} onChange={(e) => { setValor(e.target.value); setErro(''); }}
                  className="w-full bg-surface-2 border border-line rounded-xl pl-12 pr-4 py-3 font-num text-2xl outline-none focus:border-accent transition text-cream" />
              </div>

              {/* DESCONTAR DE QUAL ORÇAMENTO? */}
              {tipo === 'despesa' && orcamentos.length > 0 && (
                <div className="mb-3">
                  <p className="text-muted text-xs mb-1.5 px-0.5">Descontar de qual orçamento?</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button onClick={() => { setOrcamentoId(null); setErro(''); }}
                      className={`shrink-0 rounded-xl px-3 py-2 text-left border transition ${!orcamentoId ? 'border-accent bg-accent/10' : 'border-line bg-surface-2'}`}>
                      <span className="block text-xs font-semibold text-cream">💵 Saldo geral</span>
                      <span className="block text-[0.7rem] text-muted">sem orçamento</span>
                    </button>
                    {orcamentos.map((o) => {
                      const s = statusOrcamento(o, lancamentos);
                      const ativo = orcamentoId === o.id;
                      return (
                        <button key={o.id} onClick={() => { setOrcamentoId(ativo ? null : o.id); setErro(''); }}
                          className={`shrink-0 rounded-xl px-3 py-2 text-left border transition ${ativo ? 'border-accent bg-accent/10' : 'border-line bg-surface-2'}`}>
                          <span className="block text-xs font-semibold text-cream">{o.icone} {o.nome}</span>
                          <span className={`block text-[0.7rem] font-num ${s.restante <= 0 ? 'text-negative' : 'text-muted'}`}>
                            resta {formatarBRL(Math.max(0, s.restante))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AVISO DE SALDO INSUFICIENTE + atalho pro saldo geral */}
              {(erro || insuficiente) && (
                <div className="mb-3 bg-negative/8 border border-negative/25 rounded-xl px-3 py-2.5">
                  <p className="text-negative text-xs">
                    {erro || `Valor maior que o restante de "${orcSelecionado?.nome}" (${formatarBRL(Math.max(0, statusSel?.restante || 0))}).`}
                  </p>
                  <button onClick={() => { setOrcamentoId(null); setErro(''); }}
                    className="mt-1.5 text-xs font-semibold text-accent">→ Usar saldo geral</button>
                </div>
              )}

              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 mb-3 outline-none focus:border-accent transition text-cream">
                {cats.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
              </select>

              <input type="text" placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 mb-4 outline-none focus:border-accent transition placeholder:text-muted/60 text-cream" />

              <div className="flex gap-2">
                <button onClick={() => setAberto(false)} className="flex-1 py-3 rounded-xl border border-line text-muted hover:text-cream transition">Cancelar</button>
                <button onClick={salvar} disabled={salvando || insuficiente}
                  className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold active:scale-[0.99] transition disabled:opacity-50">
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
