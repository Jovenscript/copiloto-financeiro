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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-num text-lg">{c.nome}</p>
                    <p className="text-muted text-xs">fecha dia {c.diaFechamento} · vence dia {c.diaVencimento}</p>
                  </div>
                  <button onClick={() => remover(c.id)} className="text-muted/40 hover:text-negative text-lg">×</button>
                </div>

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
