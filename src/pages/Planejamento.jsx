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
  const { cofres, carregando, adicionar, atualizar, remover } = useCofres();
  const [abrir, setAbrir] = useState(false);
  const [metaAberta, setMetaAberta] = useState(null);
  const [form, setForm] = useState({ nome: '', icone: '🎯', alvo: '', aporteMensal: '', prazo: '', tipo: 'reserva' });

  async function salvar() {
    if (!form.nome || !form.alvo) return;
    await adicionar(novoCofre(form));
    setForm({ nome: '', icone: '🎯', alvo: '', aporteMensal: '', prazo: '', tipo: 'reserva' });
    setAbrir(false);
  }
  async function criarIniciais() { for (const c of COFRES_INICIAIS) await adicionar(novoCofre(c)); }
  async function depositar(c, valor) {
    const v = Number(valor) || 0;
    if (v <= 0) return;
    await atualizar(c.id, { guardado: (Number(c.guardado) || 0) + v });
  }

  if (carregando) return <div className="space-y-4 animate-pulse"><div className="h-40 bg-surface rounded-[var(--radius-card)]" /><div className="h-40 bg-surface rounded-[var(--radius-card)]" /></div>;

  // cofre vivo (atualiza guardado em tempo real dentro do ambiente)
  const cofreVivo = metaAberta ? (cofres.find((c) => c.id === metaAberta.id) || metaAberta) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <p className="text-muted text-sm">Cofres com dinheiro real — progresso calculado.</p>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm whitespace-nowrap">{abrir ? 'cancelar' : '+ Novo cofre'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="space-y-2">
              <div className="flex gap-2">
                <input placeholder="🎯" value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} className={inputCls + ' w-16 text-center'} />
                <input placeholder="Nome (ex: Casamento)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} />
              </div>
              <input type="number" inputMode="decimal" placeholder="Valor da meta (alvo)" value={form.alvo} onChange={(e) => setForm({ ...form, alvo: e.target.value })} className={inputCls} />
              <input type="number" inputMode="decimal" placeholder="Quanto guardar por mês" value={form.aporteMensal} onChange={(e) => setForm({ ...form, aporteMensal: e.target.value })} className={inputCls} />
              <input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} className={inputCls + ' text-cream'} />
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls}>
                <option value="evento">Evento (casamento, bebê...)</option>
                <option value="reserva">Reserva (emergência)</option>
                <option value="compra">Grande compra (carro, viagem...)</option>
              </select>
              <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm active:scale-[0.99] transition">Criar cofre</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {cofres.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-muted text-sm mb-3">Nenhum cofre ainda. Que tal começar pelos seus objetivos?</p>
          <button onClick={criarIniciais} className="text-sm bg-accent/20 text-accent rounded-xl px-4 py-2 hover:bg-accent/30 transition">⚡ Criar Casamento, Bebê e Reserva</button>
        </Card>
      ) : (
        cofres.map((c) => <CofreCard key={c.id} c={c} onDepositar={depositar} onRemove={() => remover(c.id)} onAbrir={() => setMetaAberta(c)} />)
      )}

      <EnvelopesSection />

      {/* AMBIENTE FOCADO DA META (casamento, bebê, emergência...) */}
      <AnimatePresence>
        {cofreVivo && <MetaWorkspace cofre={cofreVivo} onFechar={() => setMetaAberta(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ---- Envelopes / Reservas Mensais ----
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

function CofreCard({ c, onDepositar, onRemove, onAbrir }) {
  const [dep, setDep] = useState(false);
  const [valor, setValor] = useState('');
  const { pct, falta } = progressoCofre(c);
  const need = aporteNecessario(c);
  const status = statusCofre(c);

  return (
    <Card className="space-y-3">
      <button onClick={onAbrir} className="w-full flex items-start justify-between text-left active:opacity-70 transition">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{c.icone}</span>
          <div>
            <p className="font-num text-lg leading-tight">{c.nome}</p>
            <p className="text-muted text-xs">{formatarBRL(c.guardado)} de {formatarBRL(c.alvo)}</p>
          </div>
        </div>
        <span className="font-num text-accent text-lg">{pct.toFixed(0)}%</span>
      </button>

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
        {dep ? (
          <>
            <input type="number" inputMode="decimal" autoFocus placeholder="Quanto guardou?" value={valor} onChange={(e) => setValor(e.target.value)} className={inputCls} />
            <button onClick={() => { onDepositar(c, valor); setValor(''); setDep(false); }} className="bg-accent text-bg font-semibold rounded-xl px-4 text-sm">OK</button>
          </>
        ) : (
          <>
            <button onClick={() => setDep(true)} className="flex-1 bg-accent/20 text-accent rounded-xl py-2 text-sm hover:bg-accent/30 transition">+ Depositar</button>
            <button onClick={onRemove} className="text-muted/40 hover:text-negative transition px-3 text-lg">×</button>
          </>
        )}
      </div>
    </Card>
  );
}
