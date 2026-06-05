import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useLancamentos } from '../hooks/useLancamentos';
import { useCompromissos } from '../hooks/useCompromissos';
import {
  chaveMes, dataVencimento, vencimentosProximos, projecaoProximoMes,
  recorrentesPendentes, parcelamentosAtivos, totalRecorrentes, pesoParcelamentos,
} from '../core/calculos';
import {
  novoLancamento, novoRecorrente, novoParcelamento, novoCompromisso,
  categoriasDespesa, infoCategoria, RECORRENTES_INICIAIS,
} from '../core/schema';
import { linkGoogleAgenda, linkGoogleAgendaEvento } from '../core/googleAgenda';
import Card from '../components/ui/Card';
import Money, { formatarBRL } from '../components/ui/Money';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm';

export default function Compromissos() {
  const rec = useRecorrentes();
  const parc = useParcelamentos();
  const lanc = useLancamentos();
  const comp = useCompromissos();
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
  async function adiarRecorrente(r) {
    const d = new Date(); d.setDate(d.getDate() + 3);
    await rec.atualizar(r.id, { adiadoAte: d.toISOString().slice(0, 10) });
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
              const ignorado = r.ignoradoMes === ym;
              const adiado = r.adiadoAte && r.adiadoAte.startsWith(ym);
              const resolvido = pago || ignorado;
              return (
                <ItemLinha key={r.id} icone={infoCategoria(r.categoria).icone} titulo={r.descricao}
                  sub={adiado && !resolvido ? `adiado p/ dia ${r.adiadoAte.slice(8)}` : `vence dia ${r.diaVencimento}`}
                  valor={r.valor} onRemove={() => rec.remover(r.id)}>
                  <a href={linkGoogleAgenda({ descricao: r.descricao, valor: r.valor, diaVencimento: r.diaVencimento })}
                    target="_blank" rel="noopener noreferrer" title="Google Agenda"
                    className="text-accent/60 hover:text-accent text-base px-1 transition">📅</a>
                  {resolvido ? (
                    <span className="flex items-center gap-1">
                      <span className={`text-xs px-1.5 py-1 ${pago ? 'text-positive' : 'text-muted'}`}>{pago ? '✓ pago' : '— ignorado'}</span>
                      {ignorado && <button onClick={() => rec.atualizar(r.id, { ignoradoMes: null })} title="desfazer" className="text-muted/50 hover:text-cream text-sm px-1">↩</button>}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <button onClick={() => pagarRecorrente(r)} title="Marcar como pago" className="text-xs bg-positive/20 text-positive rounded-lg px-2.5 py-1.5 hover:bg-positive/30 transition">✓</button>
                      <button onClick={() => adiarRecorrente(r)} title="Adiar 3 dias" className="text-xs bg-accent/15 text-accent rounded-lg px-2.5 py-1.5 hover:bg-accent/25 transition">⏰</button>
                      <button onClick={() => rec.atualizar(r.id, { ignoradoMes: ym })} title="Ignorar este mês" className="text-xs text-muted/50 hover:text-muted rounded-lg px-2 py-1.5 transition">✕</button>
                    </span>
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

      {/* COMPROMISSOS PESSOAIS (médico, exames, reuniões...) */}
      <CompromissosSection comp={comp} />
    </div>
  );
}

// ---- Seção de compromissos não-financeiros ----
function CompromissosSection({ comp }) {
  const [abrir, setAbrir] = useState(false);
  const vazio = { titulo: '', data: '', hora: '', nota: '' };
  const [form, setForm] = useState(vazio);

  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = [...comp.compromissos].filter((c) => c.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));

  async function salvar() {
    if (!form.titulo || !form.data) return;
    await comp.adicionar(novoCompromisso(form));
    setForm(vazio); setAbrir(false);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <p className="font-num text-lg">📌 Compromissos & lembretes</p>
          <p className="text-muted text-xs">médico, exames, reuniões, eventos...</p>
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-3 space-y-2">
              <input type="text" placeholder="O quê? (ex: Consulta médica)" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} />
              <div className="flex gap-2">
                <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inputCls + ' text-cream flex-1'} />
                <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className={inputCls + ' text-cream w-28'} />
              </div>
              <input type="text" placeholder="Nota (opcional)" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} className={inputCls} />
              <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Adicionar</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {futuros.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum compromisso futuro. Adicione médico, exame, reunião...</p>
      ) : (
        <div className="space-y-2">
          {futuros.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3">
              <span className="text-xl">📌</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">{c.titulo}</p>
                <p className="text-muted text-xs">{c.data.split('-').reverse().join('/')}{c.hora ? ` · ${c.hora}` : ''}{c.nota ? ` · ${c.nota}` : ''}</p>
              </div>
              <a href={linkGoogleAgendaEvento(c)} target="_blank" rel="noopener noreferrer" title="Google Agenda" className="text-accent/60 hover:text-accent text-base px-1 transition">📅</a>
              <button onClick={() => comp.remover(c.id)} className="text-muted/40 hover:text-negative transition text-lg leading-none px-1">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
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
