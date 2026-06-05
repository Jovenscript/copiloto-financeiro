import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Roadmap from '../components/Roadmap';
import Backup from '../components/Backup';

export default function Perfil() {
  const { user, sair } = useAuth();
  return (
    <div className="space-y-5">
      <Card>
        <p className="text-muted text-xs mb-1">Conectado como</p>
        <p className="font-num text-lg break-all">{user?.email}</p>
      </Card>

      <Backup />
      <Roadmap />

      <button onClick={sair} className="w-full border border-negative/40 text-negative rounded-2xl py-3 hover:bg-negative/10 transition">Sair da conta</button>
    </div>
  );
}
