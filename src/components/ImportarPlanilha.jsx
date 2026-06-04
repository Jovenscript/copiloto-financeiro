import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLancamentos } from '../hooks/useLancamentos';
import { novoLancamento, categoriaPorDescricao, infoCategoria } from '../core/schema';
import { chaveMes } from '../core/calculos';
import { formatarBRL } from './ui/Money';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm text-cream';

// acha coluna de forma flexível (Tipo / Descrição / Valor)
function pega(row, ...chaves) {
  const k = Object.keys(row).find((k) => chaves.some((c) => k.toLowerCase().includes(c)));
  return k ? row[k] : undefined;
}

export default function ImportarPlanilha({ aberto, onFechar }) {
  const { lancamentos, adicionar, remover } = useLancamentos();
  const [mes, setMes] = useState(chaveMes());
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState('');
  const [importando, setImportando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function aoEscolherArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setErro(''); setPronto(false); setItens(null);
    try {
      const XLSX = await import('xlsx'); // carrega o leitor só agora (mantém o app leve)
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const parsed = rows.map((r) => {
        const tipoRaw = (pega(r, 'tipo') || '').toString();
        const descricao = (pega(r, 'descri', 'nome') || '').toString().trim();
        const valor = Number(pega(r, 'valor', 'r$')) || 0;
        return {
          tipo: tipoRaw.toLowerCase().startsWith('rece') ? 'receita' : 'despesa',
          descricao, valor,
          categoria: categoriaPorDescricao(descricao, tipoRaw),
        };
      }).filter((x) => x.valor > 0 && x.descricao);
      if (!parsed.length) { setErro('Não achei linhas válidas. A planilha precisa ter colunas Tipo, Descrição e Valor.'); return; }
      setItens(parsed);
    } catch (err) {
      setErro('Não consegui ler o arquivo. É um .xlsx?');
    }
  }

  async function confirmar() {
    if (!itens) return;
    setImportando(true);
    try {
      // dedup: remove importações antigas DESSE mês (evita duplicar ao reimportar)
      const antigos = lancamentos.filter((l) => l.origem === 'importado' && (l.data || '').startsWith(mes));
      for (const a of antigos) await remover(a.id);
      // cria os lançamentos do mês
      for (const it of itens) {
        await adicionar(novoLancamento({ tipo: it.tipo, valor: it.valor, categoria: it.categoria, descricao: it.descricao, data: `${mes}-01`, pago: true, origem: 'importado' }));
      }
      setPronto(true);
    } finally {
      setImportando(false);
    }
  }

  function fechar() { setItens(null); setErro(''); setPronto(false); setMes(chaveMes()); onFechar(); }

  const totRec = itens?.filter((i) => i.tipo === 'receita').reduce((s, i) => s + i.valor, 0) || 0;
  const totDesp = itens?.filter((i) => i.tipo === 'despesa').reduce((s, i) => s + i.valor, 0) || 0;
  const jaImportado = lancamentos.filter((l) => l.origem === 'importado' && (l.data || '').startsWith(mes)).length;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={fechar}>
          <motion.div className="w-full max-w-md bg-surface border border-line rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}>

            {pronto ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-num text-2xl mb-1">Importado!</p>
                <p className="text-muted text-sm mb-5">{itens.length} lançamentos em {mes}. Olha no Início.</p>
                <button onClick={fechar} className="w-full bg-accent text-bg font-semibold rounded-xl py-3">Fechar</button>
              </div>
            ) : (
              <>
                <p className="font-num text-xl mb-1">📥 Importar planilha</p>
                <p className="text-muted text-xs mb-4">Vira os lançamentos do mês escolhido.</p>

                <label className="text-muted text-xs">Mês de destino</label>
                <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputCls + ' mb-3 mt-1'} />

                <label className="block w-full text-center bg-surface-2 border border-dashed border-line rounded-xl py-4 cursor-pointer hover:border-accent transition mb-3">
                  <span className="text-sm text-accent">{itens ? '✓ Arquivo lido — trocar' : 'Escolher arquivo .xlsx'}</span>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={aoEscolherArquivo} />
                </label>

                {erro && <p className="text-negative text-sm mb-3">{erro}</p>}

                {jaImportado > 0 && !pronto && (
                  <p className="text-xs text-accent bg-accent/10 rounded-lg p-2 mb-3">
                    ⚠ Já tem {jaImportado} lançamento(s) importado(s) em {mes}. Importar de novo vai substituí-los.
                  </p>
                )}

                {itens && (
                  <>
                    <div className="bg-surface-2 rounded-xl p-3 mb-3 max-h-52 overflow-y-auto space-y-1.5">
                      {itens.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="truncate">{infoCategoria(it.categoria).icone} {it.descricao}</span>
                          <span className={it.tipo === 'receita' ? 'text-positive' : 'text-negative'}>
                            {it.tipo === 'receita' ? '+' : '−'}{formatarBRL(it.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted">Receitas</span><span className="text-positive">{formatarBRL(totRec)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted">Despesas</span><span className="text-negative">{formatarBRL(totDesp)}</span>
                    </div>
                    <p className="text-muted/70 text-[0.7rem] mb-3">
                      💡 Se você importa o mês, não precisa marcar as contas fixas como pagas também (evita contar 2x).
                    </p>
                  </>
                )}

                <div className="flex gap-2">
                  <button onClick={fechar} className="flex-1 py-3 rounded-xl border border-line text-muted hover:text-cream transition">Cancelar</button>
                  <button onClick={confirmar} disabled={!itens || importando}
                    className="flex-1 py-3 rounded-xl bg-accent text-bg font-semibold active:scale-[0.99] transition disabled:opacity-40">
                    {importando ? 'Importando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
