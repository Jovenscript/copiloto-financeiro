import { useState } from 'react';
import { useCartoes } from '../hooks/useCartoes';
import { useLancamentos } from '../hooks/useLancamentos';
import { faturaCartao, chaveMes } from '../core/calculos';
import { novoCartao, infoCategoria } from '../core/schema';
import Card from '../components/ui/Card';
import { formatarBRL } from '../components/ui/Money';

const inputCls = 'w-full bg-surface-2 border border-line rounded-xl px-3 py-2.5 outline-none focus:border-accent transition text-sm';

export default function Cartoes() {
  const { cartoes, adicionar, atualizar, remover } = useCartoes();
  const { lancamentos } = useLancamentos();
  const [abrir, setAbrir] = useState(false);
  const [form, setForm] = useState({ nome: '', limite: '', diaFechamento: '', diaVencimento: '' });
  const ym = chaveMes();

  async function salvar() {
    if (!form.nome) return;
    await adicionar(novoCartao(form));
    setForm({ nome: '', limite: '', diaFechamento: '', diaVencimento: '' });
    setAbrir(false);
  }

  return (
    <div className="space-y-5">
      {/* EXPLICAÇÃO */}
      <Card className="bg-accent/5 border-accent/20">
        <p className="text-sm text-cream/90"><strong>💳 Pra que serve:</strong> aqui você vê a <strong>fatura de cada cartão</strong> — quanto já gastou no mês, em quais categorias, e quanto sobra do limite. Ao lançar uma compra (botão +), escolha o cartão e ela aparece aqui.</p>
      </Card>

      <div className="flex items-center justify-between px-1">
        <p className="text-muted text-sm">Suas faturas deste mês</p>
        <button onClick={() => setAbrir(!abrir)} className="text-accent text-sm">{abrir ? 'cancelar' : '+ Novo cartão'}</button>
      </div>

      {abrir && (
        <Card className="space-y-2">
          <input placeholder="Nome (ex: Nubank)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} />
          <input type="number" inputMode="decimal" placeholder="Limite total" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} className={inputCls} />
          <div className="flex gap-2">
            <input type="number" inputMode="numeric" placeholder="Dia fechamento" value={form.diaFechamento} onChange={(e) => setForm({ ...form, diaFechamento: e.target.value })} className={inputCls} />
            <input type="number" inputMode="numeric" placeholder="Dia vencimento" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} className={inputCls} />
          </div>
          <button onClick={salvar} className="w-full bg-accent text-bg font-semibold rounded-xl py-2.5 text-sm">Adicionar cartão</button>
        </Card>
      )}

      {cartoes.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-muted text-sm">Nenhum cartão ainda. Adicione um pra acompanhar a fatura.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cartoes.map((c) => {
            const fatura = faturaCartao(c.id, lancamentos, ym, c.limite);
            return (
              <Card key={c.id} className="space-y-3">
                <CabecalhoCartao c={c} onAtualizar={atualizar} onRemover={() => remover(c.id)} />

                <div className="bg-surface-2 rounded-xl px-4 py-3">
                  <p className="text-muted text-[0.65rem] uppercase tracking-wider">Fatura deste mês</p>
                  <p className="font-num text-3xl text-negative">{formatarBRL(fatura.total)}</p>
                  {c.limite > 0 && <p className="text-muted text-xs mt-1">de {formatarBRL(c.limite)} de limite</p>}
                </div>

                {c.limite > 0 && (
                  <div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${fatura.pctLimite > 80 ? 'bg-negative' : 'bg-accent'}`} style={{ width: `${fatura.pctLimite}%` }} />
                    </div>
                    <p className="text-muted text-xs mt-1">{fatura.pctLimite.toFixed(0)}% usado · sobram {formatarBRL(c.limite - fatura.total)}</p>
                  </div>
                )}

                {fatura.porCategoria.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-muted text-xs uppercase tracking-wider">Por categoria</p>
                    {fatura.porCategoria.slice(0, 5).map((cat) => {
                      const info = infoCategoria(cat.categoria);
                      return (
                        <div key={cat.categoria} className="flex justify-between text-sm">
                          <span className="text-cream/90">{info.icone} {info.label}</span>
                          <span className="font-num">{formatarBRL(cat.valor)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Cabeçalho do cartão — toca no nome pra editar tudo (nome, limite, dia fechamento/vencimento).
function CabecalhoCartao({ c, onAtualizar, onRemover }) {
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ nome: c.nome, limite: c.limite, diaFechamento: c.diaFechamento, diaVencimento: c.diaVencimento });

  async function salvar() {
    await onAtualizar(c.id, {
      nome: (form.nome || '').trim() || c.nome,
      limite: Number(form.limite) || 0,
      diaFechamento: Math.min(31, Math.max(1, Number(form.diaFechamento) || c.diaFechamento)),
      diaVencimento: Math.min(31, Math.max(1, Number(form.diaVencimento) || c.diaVencimento)),
    });
    setEditar(false);
  }

  if (editar) {
    return (
      <div className="space-y-2 border border-accent/40 rounded-xl p-3 -m-1">
        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" className={inputCls} />
        <input type="number" inputMode="decimal" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} placeholder="Limite" className={inputCls} />
        <div className="flex gap-2">
          <input type="number" inputMode="numeric" min={1} max={31} value={form.diaFechamento} onChange={(e) => setForm({ ...form, diaFechamento: e.target.value })} placeholder="Fecha dia" className={inputCls} />
          <input type="number" inputMode="numeric" min={1} max={31} value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} placeholder="Vence dia" className={inputCls} />
        </div>
        <div className="flex gap-2">
          <button onClick={salvar} className="flex-1 bg-accent text-white font-semibold rounded-xl py-2 text-sm">Salvar</button>
          <button onClick={() => { setEditar(false); setForm({ nome: c.nome, limite: c.limite, diaFechamento: c.diaFechamento, diaVencimento: c.diaVencimento }); }} className="bg-surface-2 border border-line rounded-xl px-4 text-sm text-cream">Cancelar</button>
          <button onClick={onRemover} className="text-negative/70 hover:text-negative px-2 text-sm">Excluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <button onClick={() => setEditar(true)} className="text-left">
        <p className="font-num text-lg text-cream">{c.nome}</p>
        <p className="text-muted text-xs">fecha dia {c.diaFechamento} · vence dia {c.diaVencimento} · toque pra editar</p>
      </button>
      <button onClick={onRemover} className="text-muted/40 hover:text-negative text-lg">×</button>
    </div>
  );
}
