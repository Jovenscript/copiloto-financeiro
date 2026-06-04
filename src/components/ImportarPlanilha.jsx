import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { novoLancamento, novoRecorrente, categoriaPorDescricao, infoCategoria } from '../core/schema';
import { chaveMes } from '../core/calculos';
import { linkGoogleAgenda } from '../core/googleAgenda';
import { formatarBRL } from './ui/Money';

const inputCls = 'bg-surface-2 border border-line rounded-lg px-2 py-1.5 outline-none focus:border-accent transition text-sm text-cream';

function pega(row, ...chaves) {
  const k = Object.keys(row).find((k) => chaves.some((c) => k.toLowerCase().includes(c)));
  return k ? row[k] : undefined;
}

export default function ImportarPlanilha({ aberto, onFechar }) {
  const { adicionar: addLanc } = useLancamentos();
  const rec = useRecorrentes();
  const [mes, setMes] = useState(chaveMes());
  const [itens, setItens] = useState(null); // [{tipo, descricao, valor, categoria, dia}]
  const [erro, setErro] = useState('');
  const [importando, setImportando] = useState(false);
  const [criados, setCriados] = useState(null); // despesas criadas -> p/ Google Agenda

  async function aoEscolherArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setErro(''); setCriados(null); setItens(null);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const parsed = rows.map((r) => {
        const tipoRaw = (pega(r, 'tipo') || '').toString();
        const descricao = (pega(r, 'descri', 'nome') || '').toString().trim();
        const valor = Number(pega(r, 'valor', 'r$')) || 0;
        const ehReceita = tipoRaw.toLowerCase().startsWith('rece');
        return { tipo: ehReceita ? 'receita' : 'despesa', descricao, valor, categoria: categoriaPorDescricao(descricao, tipoRaw), dia: ehReceita ? '' : '10' };
      }).filter((x) => x.valor > 0 && x.descricao);
      if (!parsed.length) { setErro('Não achei linhas válidas (Tipo, Descrição, Valor).'); return; }
      setItens(parsed);
    } catch (err) { setErro('Não consegui ler o arquivo. É um .xlsx?'); }
  }

  function setDia(i, dia) {
    setItens((arr) => arr.map((it, idx) => (idx === i ? { ...it, dia } : it)));
  }

  async function confirmar() {
    if (!itens) return;
    setImportando(true);
    try {
      const despesasCriadas = [];
      for (const it of itens) {
        if (it.tipo === 'receita') {
          // receita -> entrada do mês escolhido
          await addLanc(novoLancamento({ tipo: 'receita', valor: it.valor, categoria: it.categoria, descricao: it.descricao, data: `${mes}-01`, pago: true, origem: 'importado' }));
        } else {
          // despesa -> conta recorrente (com vencimento que você definiu)
          const dia = Number(it.dia) || 10;
          // dedup: se já existe recorrente com mesmo nome, atualiza; senão cria
          const existente = rec.recorrentes.find((r) => (r.descricao || '').toLowerCase().trim() === it.descricao.toLowerCase().trim());
          if (existente) await rec.atualizar(existente.id, { valor: it.valor, diaVencimento: dia, categoria: it.categoria });
          else await rec.adicionar(novoRecorrente({ descricao: it.descricao, valor: it.valor, categoria: it.categoria, diaVencimento: dia }));
          despesasCriadas.push({ descricao: it.descricao, valor: it.valor, diaVencimento: dia });
        }
      }
      setCriados(despesasCriadas);
    } finally { setImportando(false); }
  }

  function fechar() { setItens(null); setErro(''); setCriados(null); setMes(chaveMes()); onFechar(); }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={fechar}>
          <motion.div className="w-full max-w-md bg-surface border border-line rounded-3xl p-5 max-h-[88vh] overflow-y-auto"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()}>

            {criados ? (
              // SUCESSO + Google Agenda
              <div>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-num text-xl">Importado!</p>
                  <p className="text-muted text-sm">Suas contas viraram lembretes recorrentes.</p>
                </div>
                {criados.length > 0 && (
                  <>
                    <p className="text-sm mb-2">📅 Mandar pro Google Agenda (ele te avisa todo mês):</p>
                    <div className="space-y-1.5 mb-4">
                      {criados.map((c, i) => (
                        <a key={i} href={linkGoogleAgenda(c)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2.5 text-sm hover:border-accent border border-transparent transition">
                          <span className="truncate">{c.descricao} · dia {c.diaVencimento}</span>
                          <span className="text-accent text-xs whitespace-nowrap ml-2">📅 Agenda →</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
                <button onClick={fechar} className="w-full bg-accent text-bg font-semibold rounded-xl py-3">Pronto</button>
              </div>
            ) : (
              <>
                <p className="font-num text-xl mb-1">📥 Importar planilha</p>
                <p className="text-muted text-xs mb-4">Despesas viram contas com vencimento · receitas viram entrada do mês.</p>

                {!itens && (
                  <>
                    <label className="text-muted text-xs">Mês das receitas</label>
                    <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputCls + ' w-full mb-3 mt-1 py-2.5'} />
                    <label className="block w-full text-center bg-surface-2 border border-dashed border-line rounded-xl py-4 cursor-pointer hover:border-accent transition">
                      <span className="text-sm text-accent">Escolher arquivo .xlsx</span>
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={aoEscolherArquivo} />
                    </label>
                  </>
                )}

                {erro && <p className="text-negative text-sm mt-3">{erro}</p>}

                {itens && (
                  <>
                    <p className="text-sm mb-2">Confere e <strong>define o dia de vencimento</strong> de cada conta:</p>
                    <div className="space-y-1.5 mb-4 max-h-72 overflow-y-auto">
                      {itens.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
                          <span className="text-base">{infoCategoria(it.categoria).icone}</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm">{it.descricao}</p>
                            <p className={`text-xs ${it.tipo === 'receita' ? 'text-positive' : 'text-muted'}`}>
                              {it.tipo === 'receita' ? '+ entrada' : '−'} {formatarBRL(it.valor)}
                            </p>
                          </div>
                          {it.tipo === 'despesa' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-muted text-xs">dia</span>
                              <input type="number" min="1" max="31" value={it.dia} onChange={(e) => setDia(i, e.target.value)} className={inputCls + ' w-14 text-center'} />
                            </div>
                          ) : (
                            <span className="text-muted text-xs">receita</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setItens(null)} className="flex-1 py-3 rounded-xl border border-line text-muted">Voltar</button>
                      <button onClick={confirmar} disabled={importando} className="flex-1 py-3 rounded-xl bg-accent text-bg font-semibold disabled:opacity-50">
                        {importando ? 'Importando...' : 'Confirmar'}
                      </button>
                    </div>
                  </>
                )}

                {!itens && <button onClick={fechar} className="w-full mt-3 py-2.5 text-muted text-sm">Cancelar</button>}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
