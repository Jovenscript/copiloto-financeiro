import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCofres } from '../hooks/useCofres';
import { patrimonio } from '../core/calculos';
import { novoCofre, COFRES_INICIAIS } from '../core/schema';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';
import MetaWorkspace from '../components/MetaWorkspace';
import { CofreCard } from './Planejamento';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm';

export default function Metas() {
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

  if (carregando) return <div className="space-y-4 animate-pulse"><div className="h-32 bg-surface rounded-2xl" /><div className="h-40 bg-surface rounded-2xl" /></div>;

  const pat = patrimonio(cofres);
  const cofreVivo = metaAberta ? (cofres.find((c) => c.id === metaAberta.id) || metaAberta) : null;

  return (
    <div className="space-y-6">
      <p className="text-muted text-sm px-1">Seus objetivos de futuro. Sem pressa — acompanhe quando quiser. 🌱</p>

      {/* PATRIMÔNIO (só aqui, fora do dashboard do dia a dia) */}
      {cofres.length > 0 && (
        <Card className="space-y-4">
          <p className="font-num text-xl font-semibold">🏦 Patrimônio</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-positive/10 border border-positive/30 rounded-xl px-4 py-3">
              <p className="text-muted text-[0.65rem] uppercase tracking-wider">Líquido (seu de verdade)</p>
              <p className="font-num text-2xl md:text-3xl text-positive">{formatarBRL(pat.liquido)}</p>
            </div>
            <div className="bg-surface-2 border border-line rounded-xl px-4 py-3">
              <p className="text-muted text-[0.65rem] uppercase tracking-wider">Total guardado</p>
              <p className="font-num text-2xl md:text-3xl">{formatarBRL(pat.guardadoBruto)}</p>
            </div>
            <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3">
              <p className="text-muted text-[0.65rem] uppercase tracking-wider">A devolver</p>
              <p className="font-num text-2xl md:text-3xl text-negative">{formatarBRL(pat.aDevolver)}</p>
            </div>
          </div>
          {pat.aDevolver > 0 && (
            <p className="text-xs text-muted bg-bg rounded-lg px-3 py-2">
              ⚠ Você tem {formatarBRL(pat.guardadoBruto)} guardado, mas {formatarBRL(pat.aDevolver)} são compromisso (ex: a devolver aos pais). Disponível de verdade: <strong className="text-positive">{formatarBRL(pat.liquido)}</strong>.
            </p>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between px-1">
        <p className="font-num text-lg">🎯 Cofres</p>
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
          <p className="text-muted text-sm mb-3">Nenhum objetivo ainda. Que tal começar?</p>
          <button onClick={criarIniciais} className="text-sm bg-accent/20 text-accent rounded-xl px-4 py-2 hover:bg-accent/30 transition">⚡ Criar Casamento, Bebê e Reserva</button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cofres.map((c) => <CofreCard key={c.id} c={c} onAtualizar={atualizar} onRemove={() => remover(c.id)} onAbrir={() => setMetaAberta(c)} />)}
        </div>
      )}

      {cofreVivo && <MetaWorkspace cofre={cofreVivo} onFechar={() => setMetaAberta(null)} />}
    </div>
  );
}
