import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useLancamentos } from '../hooks/useLancamentos';
import {
  chaveMes, dataVencimento, vencimentosProximos, projecaoProximoMes,
  recorrentesPendentes, parcelamentosAtivos, totalRecorrentes, pesoParcelamentos,
} from '../core/calculos';
import {
  novoLancamento, novoRecorrente, novoParcelamento,
  categoriasDespesa, infoCategoria, RECORRENTES_INICIAIS,
} from '../core/schema';
import Card from '../components/ui/Card';
import Money, { formatarBRL } from '../components/ui/Money';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm';

export default function Compromissos() {
  const rec = useRecorrentes();
  const parc = useParcelamentos();
  const lanc = useLancamentos();
  const ym = chaveMes();

  const venc = vencimentosProximos({ recorrentes: rec.recorrentes, parcelamentos: parc.parcelamentos, dias: 7 });
  const proj = projecaoProximoMes({ recorrentes: rec.recorrentes, parcelamentos: parc.parcelamentos });
  const pendentes = recorrentesPendentes(rec.recorrentes, ym);
  const ativos = parcelamentosAtivos(parc.parcelamentos);

  // pagar = cria lançamento + marca como pago no mês
  async function pagarRecorrente(r) {
    await lanc.adicionar(novoLancamento({ tipo: 'despesa', valor: r.valor, categoria: r.categoria, descricao: r.descricao, data: dataVencimento(r.diaVencimento, ym), pago: true, origem: 'recorrente' }));
    await rec.atualizar(r.id, { ultimoPago: ym });
  }
  async function pagarParcela(p) {
    const n = (Number(p.parcelasPagas) || 0) + 1;
    await lanc.adicionar(novoLancamento({ tipo: 'despesa', valor: p.valorParcela, categoria: p.categoria, descricao: `${p.descricao} (${n}/${p.totalParcelas})`, data: dataVencimento(p.diaVencimento, ym), pago: true, origem: 'parcela' }));
    await parc.atualizar(p.id, { parcelasPagas: n, ultimoPago: ym });
  }
  async function carregarIniciais() {
    for (const r of RECORRENTES_INICIAIS) await rec.adicionar(novoRecorrente(r));
  }

  return (
    <div className="space-y-6">
      {/* PROJEÇÃO PRÓXIMO MÊS */}
      <Card className="text-center py-6 bg-gradient-to-b from-surface-2 to-surface">
        <p className="text-muted text-xs uppercase tracking-[0.2em] mb-2">Você vai pagar mês que vem</p>
        <div className="font-num text-4xl font-semibold">{formatarBRL(proj.total)}</div>
        <p className="text-muted text-xs mt-2">
          {formatarBRL(proj.recorrentes)} em contas fixas + {formatarBRL(proj.parcelas)} em parcelas
        </p>
      </Card>

      {/* PRÓXIMOS 7 DIAS */}
      {venc.length > 0 && (
        <Card>
          <p className="font-num text-lg mb-3">⏰ Vence nos próximos 7 dias</p>
          <div className="space-y-2">
            {venc.map((v) => (
              <div key={v.id} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2.5">
                <div className="text-sm">
                  <span>{infoCategoria(v.categoria).icone} {v.descricao}</span>
                  <span className="text-muted text-xs block">dia {v.data.slice(8)}</span>
                </div>
                <Money valor={v.valor} className="text-sm text-cream/90" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RECORRENTES */}
      <Secao
        titulo="🔁 Contas recorrentes"
        subtitulo={rec.recorrentes.length ? `${formatarBRL(totalRecorrentes(rec.recorrentes))}/mês no total` : null}
        labelAdd="Nova conta fixa"
        formFields={[
          { k: 'descricao', ph: 'Nome (ex: Aluguel)', type: 'text' },
          { k: 'valor', ph: 'Valor', type: 'number' },
          { k: 'diaVencimento', ph: 'Dia venc. (1-31)', type: 'number' },
        ]}
        comCategoria
        onAdd={(f) => rec.adicionar(novoRecorrente(f))}
      >
        {rec.recorrentes.length === 0 ? (
          <VazioComSeed onSeed={carregarIniciais} texto="Nenhuma conta fixa ainda." labelSeed="Carregar minhas contas conhecidas" />
        ) : (
          <div className="space-y-2">
            {rec.recorrentes.map((r) => {
              const pago = r.ultimoPago === ym;
              return (
                <ItemLinha key={r.id} icone={infoCategoria(r.categoria).icone} titulo={r.descricao}
                  sub={`vence dia ${r.diaVencimento}`} valor={r.valor} onRemove={() => rec.remover(r.id)}>
                  {pago ? (
                    <span className="text-positive text-xs px-2 py-1">✓ pago</span>
                  ) : (
                    <button onClick={() => pagarRecorrente(r)} className="text-xs bg-accent/20 text-accent rounded-lg px-3 py-1.5 hover:bg-accent/30 transition">Pagar</button>
                  )}
                </ItemLinha>
              );
            })}
          </div>
        )}
      </Secao>

      {/* PARCELAMENTOS */}
      <Secao
        titulo="🧾 Parcelamentos & financiamentos"
        subtitulo={ativos.length ? `${formatarBRL(pesoParcelamentos(parc.parcelamentos))}/mês · ${ativos.length} ativo(s)` : null}
        labelAdd="Novo parcelamento"
        formFields={[
          { k: 'descricao', ph: 'Nome (ex: Notebook)', type: 'text' },
          { k: 'valorParcela', ph: 'Valor da parcela', type: 'number' },
          { k: 'totalParcelas', ph: 'Total de parcelas', type: 'number' },
          { k: 'parcelasPagas', ph: 'Já pagas (0 se nova)', type: 'number' },
          { k: 'diaVencimento', ph: 'Dia venc.', type: 'number' },
        ]}
        comCategoria
        onAdd={(f) => parc.adicionar(novoParcelamento(f))}
      >
        {parc.parcelamentos.length === 0 ? (
          <p className="text-muted text-sm">Nenhum parcelamento. Adicione acima.</p>
        ) : (
          <div className="space-y-2">
            {parc.parcelamentos.map((p) => {
              const pagas = Number(p.parcelasPagas) || 0;
              const quitado = pagas >= p.totalParcelas;
              const pgMes = p.ultimoPago === ym;
              const restante = (p.totalParcelas - pagas) * p.valorParcela;
              return (
                <ItemLinha key={p.id} icone={infoCategoria(p.categoria).icone} titulo={p.descricao}
                  sub={`${pagas}/${p.totalParcelas} · ${formatarBRL(p.valorParcela)}/mês · falta ${formatarBRL(restante)}`}
                  valor={p.valorParcela} onRemove={() => parc.remover(p.id)}>
                  {quitado ? (
                    <span className="text-positive text-xs px-2 py-1">✓ quitado</span>
                  ) : pgMes ? (
                    <span className="text-positive text-xs px-2 py-1">✓ mês</span>
                  ) : (
                    <button onClick={() => pagarParcela(p)} className="text-xs bg-accent/20 text-accent rounded-lg px-3 py-1.5 hover:bg-accent/30 transition">Pagar</button>
                  )}
                </ItemLinha>
              );
            })}
          </div>
        )}
      </Secao>
    </div>
  );
}

// ---- Subcomponentes ----
function Secao({ titulo, subtitulo, labelAdd, formFields, comCategoria, onAdd, children }) {
  const [abrir, setAbrir] = useState(false);
  const vazio = Object.fromEntries(formFields.map((f) => [f.k, '']));
  const [form, setForm] = useState({ ...vazio, categoria: comCategoria ? 'moradia' : undefined });

  async function salvar() {
    if (!form.descricao && !form.valor && !form.valorParcela) return;
    await onAdd(form);
    setForm({ ...vazio, categoria: comCategoria ? 'moradia' : undefined });
    setAbrir(false);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <p className="font-num text-lg">{titulo}</p>
          {subtitulo && <p className="text-muted text-xs">{subtitulo}</p>}
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : `+ ${labelAdd}`}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-3 space-y-2">
              {formFields.map((f) => (
                <input key={f.k} type={f.type} inputMode={f.type === 'number' ? 'decimal' : 'text'} placeholder={f.ph}
                  value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className={inputCls} />
              ))}
              {comCategoria && (
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
                  {categoriasDespesa().map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
                </select>
              )}
              <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm active:scale-[0.99] transition">Adicionar</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

function ItemLinha({ icone, titulo, sub, valor, onRemove, children }) {
  return (
    <div className="flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3">
      <span className="text-xl">{icone}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm">{titulo}</p>
        <p className="text-muted text-xs truncate">{sub}</p>
      </div>
      {children}
      <button onClick={onRemove} className="text-muted/40 hover:text-negative transition text-lg leading-none px-1">×</button>
    </div>
  );
}

function VazioComSeed({ onSeed, texto, labelSeed }) {
  return (
    <Card className="text-center py-6">
      <p className="text-muted text-sm mb-3">{texto}</p>
      <button onClick={onSeed} className="text-sm bg-accent/20 text-accent rounded-xl px-4 py-2 hover:bg-accent/30 transition">⚡ {labelSeed}</button>
    </Card>
  );
}
