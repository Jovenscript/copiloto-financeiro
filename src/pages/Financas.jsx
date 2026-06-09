import { useState } from 'react';
import Lancamentos from './Lancamentos';
import Planejamento from './Planejamento';
import Cartoes from './Cartoes';
import Insights from './Insights';

const SUB = [
  { id: 'mov', rotulo: 'Lançar', emoji: '✏️', Comp: Lancamentos },
  { id: 'plan', rotulo: 'Planos', emoji: '🎯', Comp: Planejamento },
  { id: 'cartoes', rotulo: 'Cartões', emoji: '💳', Comp: Cartoes },
  { id: 'analise', rotulo: 'Análise', emoji: '📊', Comp: Insights },
];

export default function Financas() {
  const [sub, setSub] = useState('mov');
  const Atual = SUB.find((s) => s.id === sub).Comp;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 bg-bg rounded-2xl p-1.5">
        {SUB.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={`py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition flex flex-col md:flex-row items-center justify-center gap-1 ${sub === s.id ? 'bg-accent text-bg' : 'text-muted hover:text-cream'}`}>
            <span>{s.emoji}</span> {s.rotulo}
          </button>
        ))}
      </div>
      <Atual />
    </div>
  );
}
