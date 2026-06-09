import { useState } from 'react';
import { useLancamentos } from '../hooks/useLancamentos';
import { extratoPeriodo } from '../core/calculos';
import { infoCategoria } from '../core/schema';
import Card from './ui/Card';
import { formatarBRL } from './ui/Money';

export default function Extrato() {
  const { lancamentos } = useLancamentos();
  const [dias, setDias] = useState(60);
  const [filtro, setFiltro] = useState('todos'); // todos | receita | despesa

  let itens = extratoPeriodo(lancamentos, dias);
  if (filtro !== 'todos') itens = itens.filter((l) => l.tipo === filtro);

  const totalEntrou = itens.filter((l) => l.tipo === 'receita').reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const totalSaiu = itens.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + (Number(l.valor) || 0), 0);

  function baixarCSV() {
    const linhas = [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Pago']];
    itens.forEach((l) => {
      linhas.push([l.data, l.tipo, infoCategoria(l.categoria).label, l.descricao, String(l.valor).replace('.', ','), l.pago ? 'Sim' : 'Não']);
    });
    const csv = linhas.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `extrato-${dias}dias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-num text-xl font-semibold">📄 Extrato</p>
        <button onClick={baixarCSV} className="text-accent text-sm">⬇️ baixar CSV</button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[30, 60, 90].map((d) => (
          <button key={d} onClick={() => setDias(d)}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${dias === d ? 'bg-accent text-bg' : 'bg-surface-2 text-muted'}`}>
            {d} dias
          </button>
        ))}
        <span className="w-px bg-line mx-1" />
        {[['todos', 'Tudo'], ['receita', 'Entradas'], ['despesa', 'Saídas']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${filtro === id ? 'bg-accent text-bg' : 'bg-surface-2 text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Totais do período */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-positive/10 rounded-xl px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase">Entrou</p>
          <p className="font-num text-lg text-positive">{formatarBRL(totalEntrou)}</p>
        </div>
        <div className="bg-negative/10 rounded-xl px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase">Saiu</p>
          <p className="font-num text-lg text-negative">{formatarBRL(totalSaiu)}</p>
        </div>
      </div>

      {/* Lista */}
      {itens.length === 0 ? (
        <p className="text-muted text-sm text-center py-4">Sem movimentação no período.</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {itens.map((l) => {
            const info = infoCategoria(l.categoria);
            const ehReceita = l.tipo === 'receita';
            return (
              <div key={l.id} className="flex items-center justify-between text-sm border-b border-line/40 pb-1.5">
                <div className="min-w-0">
                  <p className="text-cream/90 truncate">{info.icone} {l.descricao}</p>
                  <p className="text-muted text-xs">{l.data.slice(8, 10)}/{l.data.slice(5, 7)} · {info.label}</p>
                </div>
                <span className={`font-num shrink-0 ml-2 ${ehReceita ? 'text-positive' : 'text-negative'}`}>
                  {ehReceita ? '+' : '−'}{formatarBRL(l.valor)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
