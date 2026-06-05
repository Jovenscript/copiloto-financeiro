import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartoes } from '../hooks/useCartoes';
import { useLancamentos } from '../hooks/useLancamentos';
import { faturaCartao, chaveMes } from '../core/calculos';
import { novoCartao, infoCategoria } from '../core/schema';
import { linkGoogleAgenda } from '../core/googleAgenda';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm text-cream';

export default function Cartoes() {
  const { cartoes, adicionar, remover } = useCartoes();
  const { lancamentos } = useLancamentos();
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ nome: '', limite: '', diaVencimento: '' });
  const ym = chaveMes();

  async function salvar() {
    if (!form.nome) return;
    await adicionar(novoCartao(form));
    setForm({ nome: '', limite: '', diaVencimento: '' });
    setAbrir(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="font-num text-lg">💳 Cartões</p>
          <p className="text-muted text-xs">a fatura do mês, quebrada por categoria</p>
        </div>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : '+ Novo'}</button>
      </div>

      <AnimatePresence>
        {abrir && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="space-y-2">
              <input type="text" placeholder="Nome (ex: Nubank)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} />
              <div className="flex gap-2">
                <input type="number" placeholder="Limite (opcional)" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} className={inputCls} />
                <input type="number" placeholder="Dia venc." value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} className={inputCls + ' w-32'} />
              </div>
              <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Criar cartão</button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {cartoes.length === 0 ? (
        <p className="text-muted text-sm px-1">Nenhum cartão. Crie um e marque seus gastos nele na hora de lançar — aí a fatura se monta sozinha.</p>
      ) : (
        cartoes.map((c) => {
          const f = faturaCartao(c.id, lancamentos, ym, c.limite);
          return (
            <Card key={c.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-num text-lg">{c.nome}</p>
                  <p className="text-muted text-xs">fatura de {ym.slice(5)}/{ym.slice(0, 4)} · vence dia {c.diaVencimento}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={linkGoogleAgenda({ descricao: `Fatura ${c.nome}`, valor: f.total, diaVencimento: c.diaVencimento })}
                    target="_blank" rel="noopener noreferrer" title="Google Agenda" className="text-accent/60 hover:text-accent text-base px-1">📅</a>
                  <button onClick={() => remover(c.id)} className="text-muted/40 hover:text-negative text-lg leading-none px-1">×</button>
                </div>
              </div>

              <div className="font-num text-3xl font-semibold">{formatarBRL(f.total)}</div>

              {c.limite > 0 && (
                <div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${f.pctLimite > 80 ? 'bg-negative' : 'bg-accent'}`} style={{ width: `${f.pctLimite}%` }} />
                  </div>
                  <p className="text-muted text-xs mt-1">{Math.round(f.pctLimite)}% de {formatarBRL(c.limite)} de limite</p>
                </div>
              )}

              {f.porCategoria.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {f.porCategoria.map((p) => (
                    <div key={p.categoria} className="flex justify-between text-sm">
                      <span className="text-muted">{infoCategoria(p.categoria).icone} {infoCategoria(p.categoria).label}</span>
                      <span>{formatarBRL(p.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-xs">Sem gastos neste cartão ainda este mês.</p>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
