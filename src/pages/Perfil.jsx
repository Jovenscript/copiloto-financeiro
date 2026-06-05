import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

export default function Perfil() {
  const { user, sair } = useAuth();
  return (
    <div className="space-y-5">
      <Card>
        <p className="text-muted text-xs mb-1">Conectado como</p>
        <p className="font-num text-lg break-all">{user?.email}</p>
      </Card>

      <Card className="space-y-1">
        <p className="text-sm font-medium mb-2">⚙️ Em breve</p>
        {['🔔 Preferências de notificação', '📅 Integração Google Agenda', '💾 Backup e exportar dados', '↩️ Restaurar padrão de fábrica'].map((x, i) => (
          <p key={i} className="text-muted text-sm py-1.5">{x}</p>
        ))}
      </Card>

      <button onClick={sair} className="w-full border border-negative/40 text-negative rounded-2xl py-3 hover:bg-negative/10 transition">Sair da conta</button>
    </div>
  );
}
