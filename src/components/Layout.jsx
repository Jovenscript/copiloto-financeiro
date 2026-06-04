import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../config';
import RegistroRapido from './RegistroRapido';
import Avisos from './Avisos';

const ABAS = [
  { to: '/',             rotulo: 'Início',       icone: '◑' },
  { to: '/lancamentos',  rotulo: 'Lançamentos',  icone: '↹' },
  { to: '/planejamento', rotulo: 'Planejamento', icone: '◎' },
  { to: '/compromissos', rotulo: 'Contas',       icone: '▤' },
  { to: '/insights',     rotulo: 'Insights',     icone: '✦' },
];

export default function Layout({ children }) {
  const { sair } = useAuth();
  const loc = useLocation();
  const tituloAtual = ABAS.find((a) => a.to === loc.pathname)?.rotulo || APP_NAME;

  return (
    <div className="min-h-full max-w-xl mx-auto flex flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-muted text-xs uppercase tracking-[0.2em]">{APP_NAME}</p>
          <h1 className="font-num text-2xl font-semibold tracking-tight">{tituloAtual}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Avisos />
          <button onClick={sair} className="text-muted hover:text-cream text-sm border border-line rounded-lg px-3 py-1.5 transition">Sair</button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28">{children}</main>

      <RegistroRapido />

      <nav className="fixed bottom-0 inset-x-0 max-w-xl mx-auto bg-surface/95 backdrop-blur border-t border-line z-30">
        <div className="flex items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {ABAS.map((a) => (
            <NavLink key={a.to} to={a.to}
              className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[0.68rem] transition ${isActive ? 'text-accent' : 'text-muted hover:text-cream'}`}>
              <span className="text-lg leading-none">{a.icone}</span>
              {a.rotulo}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
