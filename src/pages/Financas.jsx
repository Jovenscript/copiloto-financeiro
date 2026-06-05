import { useState } from 'react';
import Lancamentos from './Lancamentos';
import Planejamento from './Planejamento';
import Cartoes from './Cartoes';
import Insights from './Insights';

const SUB = [
  { id: 'mov', rotulo: 'Lançar', Comp: Lancamentos },
  { id: 'plan', rotulo: 'Planos', Comp: Planejamento },
  { id: 'cartoes', rotulo: 'Cartões', Comp: Cartoes },
  { id: 'analise', rotulo: 'Análise', Comp: Insights },
];

export default function Financas() {
  const [sub, setSub] = useState('mov');
  const Atual = SUB.find((s) => s.id === sub).Comp;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-1 bg-bg rounded-xl p-1">
        {SUB.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={`py-2 rounded-lg text-xs font-medium transition ${sub === s.id ? 'bg-accent text-bg' : 'text-muted hover:text-cream'}`}>
            {s.rotulo}
          </button>
        ))}
      </div>
      <Atual />
    </div>
  );
}
