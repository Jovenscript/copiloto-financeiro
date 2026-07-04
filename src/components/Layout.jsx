import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Wallet, Target, CalendarDays, User } from 'lucide-react';
import { APP_NAME } from '../config';
import RegistroRapido from './RegistroRapido';
import Onboarding from './Onboarding';
import SincronizadorNativo from './SincronizadorNativo';
import Avisos from './Avisos';

const ABAS = [
  { to: '/',         rotulo: 'Início',   Icone: Home },
  { to: '/financas', rotulo: 'Finanças', Icone: Wallet },
  { to: '/metas',    rotulo: 'Metas',    Icone: Target },
  { to: '/agenda',   rotulo: 'Agenda',   Icone: CalendarDays },
  { to: '/perfil',   rotulo: 'Perfil',   Icone: User },
];

// APP-SHELL: header e nav são partes FIXAS DO LAYOUT (flex), não position:fixed.
// O <main> tem min-h-0 (obrigatório em flex pra ele conseguir encolher e rolar
// de verdade) — sem isso a nav de baixo some cortada em telas com conteúdo alto.
export default function Layout({ children }) {
  const loc = useLocation();
  const tituloAtual = ABAS.find((a) => a.to === loc.pathname)?.rotulo || APP_NAME;

  return (
    <div className="h-full flex overflow-hidden bg-bg">
      {/* SIDEBAR — desktop, fixa na lateral */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:fixed md:inset-y-0 md:border-r md:border-line md:bg-surface md:px-5 md:py-6 z-30">
        <div className="flex items-center gap-2.5 px-1 mb-10">
          <span className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">C</span>
          <div>
            <p className="font-num text-base font-bold leading-none text-cream">Copiloto</p>
            <p className="text-muted text-[0.65rem] mt-0.5">Financeiro</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {ABAS.map(({ to, rotulo, Icone }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm font-medium transition rounded-md ${
                  isActive ? 'text-cream bg-surface-2' : 'text-muted hover:text-cream hover:bg-surface-2/60'
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent" />}
                  <Icone size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  {rotulo}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* COLUNA principal — desloca pra direita da sidebar no desktop */}
      <div className="flex-1 min-w-0 flex flex-col h-full md:ml-64">
        {/* HEADER — fixo no topo, não rola */}
        <header className="shrink-0 border-b border-line bg-bg/90 backdrop-blur z-20">
          <div className="flex items-center justify-between px-5 md:px-8 pt-5 pb-3 max-w-5xl mx-auto w-full">
            <div>
              <p className="text-muted text-xs uppercase tracking-[0.16em] md:hidden">{APP_NAME}</p>
              <h1 className="font-num text-2xl md:text-3xl text-cream">{tituloAtual}</h1>
            </div>
            <Avisos />
          </div>
        </header>

        {/* MAIN — o ÚNICO que rola. min-h-0 é obrigatório aqui. */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 md:px-8 pt-4 pb-28 md:pb-12 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div key={loc.pathname}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* BOTTOM NAV — mobile, parte do layout (flex), sempre visível */}
        <nav className="md:hidden shrink-0 bg-surface border-t border-line">
          <div className="flex items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {ABAS.map(({ to, rotulo, Icone }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[0.68rem] transition ${isActive ? 'text-accent' : 'text-muted'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="navdot" className="absolute -top-0.5 h-1 w-1 rounded-full bg-accent" />}
                    <Icone size={21} strokeWidth={isActive ? 2.4 : 1.8} />
                    {rotulo}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Overlays: FAB de lançar, onboarding, notificações nativas */}
      <RegistroRapido />
      <Onboarding />
      <SincronizadorNativo />
    </div>
  );
}
