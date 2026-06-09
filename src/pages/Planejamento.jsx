import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCofres } from '../hooks/useCofres';
import { useEnvelopes } from '../hooks/useEnvelopes';
import { useLancamentos } from '../hooks/useLancamentos';
import { progressoCofre, aporteNecessario, statusCofre, statusEnvelope } from '../core/calculos';
import { novoCofre, novoEnvelope, COFRES_INICIAIS, categoriasDespesa, infoCategoria } from '../core/schema';
import Card from '../components/ui/Card';
import Money, { formatarBRL } from '../components/ui/Money';
import MetaWorkspace from '../components/MetaWorkspace';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm';

export default function Planejamento() {
  return (
    <div className="space-y-5">
      <div className="px-1">
        <p className="text-muted text-sm">Orçamento do mês — quanto pode gastar em cada categoria.</p>
      </div>
      <EnvelopesSection />
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
        <p className="text-muted text-[0.65rem] px-1">💡 "A devolver" = quanto desse guardado é dívida (não conta como seu patrimônio).</p>
        <div className="flex gap-2">
          <button onClick={salvarEdicao} className="flex-1 bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ nome: c.nome, alvo: c.alvo, aporteMensal: c.aporteMensal, guardado: c.guardado, devolver: c.devolver || 0 }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm">Cancelar</button>
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
            <p className="font-num text-lg leading-tight">{c.nome}</p>
            <p className="text-muted text-xs">{formatarBRL(c.guardado)} guardado de {formatarBRL(c.alvo)}</p>
          </div>
        </div>
        <span className="font-num text-accent text-lg">{pct.toFixed(0)}%</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase tracking-wider">Guardado</p>
          <p className="font-num text-xl text-accent">{formatarBRL(c.guardado)}</p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase tracking-wider">Falta</p>
          <p className="font-num text-xl text-negative">{formatarBRL(falta)}</p>
        </div>
      </div>

      <div className="h-2.5 bg-bg rounded-full overflow-hidden">
        <motion.div className="h-full bg-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">faltam <strong className="text-cream/90">{formatarBRL(falta)}</strong></span>
        {need.mensal !== null && need.meses > 0 && (
          <span className="text-muted">guarde <strong className="text-cream/90">{formatarBRL(need.mensal)}</strong>/mês ({need.meses}m)</span>
        )}
      </div>

      {status && (
        <div className={`text-xs rounded-lg px-3 py-2 ${status.ok ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
          {status.ok
            ? `✓ No caminho — seu aporte de ${formatarBRL(status.planejado)} dá conta.`
            : `⚠ Atrasado — guardando ${formatarBRL(status.planejado)}, mas precisa de ${formatarBRL(status.necessario)}/mês.`}
        </div>
      )}

      <button onClick={onAbrir} className="w-full bg-surface-2 border border-line rounded-xl py-2 text-sm text-cream/90 hover:border-accent active:scale-[0.99] transition">
        Abrir ambiente →
      </button>

      <div className="flex gap-2">
        <button onClick={() => setEditar(true)} className="flex-1 bg-accent/20 text-accent rounded-xl py-2 text-sm hover:bg-accent/30 transition">✏️ Editar</button>
        <button onClick={onRemove} className="text-muted/40 hover:text-negative transition px-3 text-lg">×</button>
      </div>
    </Card>
  );
}

function EnvelopesSection() {
  const { envelopes, adicionar, remover } = useEnvelopes();
  const { lancamentos } = useLancamentos();
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ categoria: 'combustivel', metaMensal: '' });

  async function salvar() {
    if (!form.metaMensal) return;
    await adicionar(novoEnvelope(form));
    setForm({ categoria: 'combustivel', metaMensal: '' });
    setAbrir(false);
  }

  return (
    <div className="pt-2">
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <p className="font-num text-lg">📨 Envelopes do mês</p>
          <p className="text-muted text-xs">orçamento que vai abatendo (combustível, mercado...)</p>
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="mb-3 space-y-2">
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
                {categoriasDespesa().map((c) => <option key={c.id} value={c.id}>{c.icone} {c.label}</option>)}
              </select>
              <input type="number" inputMode="decimal" placeholder="Meta mensal (ex: 400)" value={form.metaMensal} onChange={(e) => setForm({ ...form, metaMensal: e.target.value })} className={inputCls} />
              <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Criar envelope</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {envelopes.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum envelope. Crie um pra Combustível, Mercado, Lazer...</p>
      ) : (
        <div className="space-y-2">
          {envelopes.map((e) => {
            const s = statusEnvelope(e, lancamentos);
            const info = infoCategoria(e.categoria);
            return (
              <Card key={e.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{info.icone} {info.label}</span>
                  <button onClick={() => remover(e.id)} className="text-muted/40 hover:text-negative text-lg leading-none">×</button>
                </div>
                <div className="h-2.5 bg-bg rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.estourou ? 'bg-negative' : 'bg-positive'}`} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">gastou {formatarBRL(s.gasto)} de {formatarBRL(s.meta)}</span>
                  <span className={s.estourou ? 'text-negative' : 'text-positive'}>
                    {s.estourou ? `estourou ${formatarBRL(-s.restante)}` : `sobram ${formatarBRL(s.restante)}`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
