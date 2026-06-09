import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { chaveMes, panoramaMes, patrimonio } from '../core/calculos';
import Card from '../components/ui/Card';
import Backup from '../components/Backup';
import Extrato from '../components/Extrato';
import { formatarBRL } from '../components/ui/Money';

export default function Perfil() {
  const { user, sair } = useAuth();
  const { lancamentos } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { cofres } = useCofres();
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const ym = chaveMes();

  const pan = panoramaMes({ lancs: lancamentos, recorrentes, parcelamentos, cofres, ym });
  const pat = patrimonio(cofres);

  return (
    <div className="space-y-5">
      {/* STATUS — entrou / saiu / saldo grandes */}
      <Card className="space-y-4">
        <p className="font-num text-xl font-semibold">📊 Status do mês</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">Entrou</p>
            <p className="font-num text-xl md:text-2xl text-positive mt-1">{formatarBRL(pan.receitas)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">Saiu</p>
            <p className="font-num text-xl md:text-2xl text-negative mt-1">{formatarBRL(pan.despesas)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">Saldo</p>
            <p className={`font-num text-xl md:text-2xl mt-1 ${pan.saldo >= 0 ? 'text-positive' : 'text-negative'}`}>{formatarBRL(pan.saldo)}</p>
          </div>
        </div>
        <div className="border-t border-line pt-3 grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">Patrimônio líquido</p>
            <p className="font-num text-lg text-accent mt-1">{formatarBRL(pat.liquido)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted text-[0.65rem] uppercase tracking-wider">A devolver</p>
            <p className="font-num text-lg text-negative mt-1">{formatarBRL(pat.aDevolver)}</p>
          </div>
        </div>
      </Card>

      {/* EXTRATO */}
      <Extrato />

      {/* CONTA */}
      <Card>
        <p className="text-muted text-xs mb-1">Conectado como</p>
        <p className="font-num text-lg break-all">{user?.email}</p>
      </Card>

      {/* MAIS OPÇÕES (backup, tour) */}
      <button onClick={() => setMaisOpcoes(!maisOpcoes)} className="w-full text-muted text-sm py-2">
        {maisOpcoes ? '▲ menos opções' : '▼ mais opções (backup, dados)'}
      </button>

      {maisOpcoes && (
        <div className="space-y-4">
          <Backup />
          <button onClick={() => { try { localStorage.removeItem('onboarded'); } catch (e) {} location.reload(); }}
            className="w-full border border-line text-muted rounded-2xl py-3 hover:text-cream transition">👋 Rever tour de boas-vindas</button>
        </div>
      )}

      <button onClick={sair} className="w-full border border-negative/40 text-negative rounded-2xl py-3 hover:bg-negative/10 transition">Sair da conta</button>
    </div>
  );
}
