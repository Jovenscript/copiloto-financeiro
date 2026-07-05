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

// APP-SHELL (aprovado): header/nav são partes fixas do layout em flex.
// min-h-0 no <main> é OBRIGATÓRIO — sem ele o flex não deixa rolar e a
// nav de baixo é cortada em páginas altas.
export default function Layout({ children }) {
  const loc = useLocation();
  const noInicio = loc.pathname === '/';
  const tituloAtual = ABAS.find((a) => a.to === loc.pathname)?.rotulo || APP_NAME;

  return (
    <div className="h-full flex overflow-hidden bg-bg">
      {/* SIDEBAR — desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:fixed md:inset-y-0 md:bg-surface md:border-r md:border-line md:px-5 md:py-6 z-30">
        <div className="flex items-center gap-2.5 px-1 mb-10">
          {/* marca: instrumento (horizonte artificial) simplificado */}
          <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: 'linear-gradient(160deg, var(--color-navy), #1E3A8A)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="#F0F4FC" />
              <path d="M 2.3 11.6 A 8 8 0 0 0 17.7 8.4 Z" fill="#0D1B2E" />
              <rect x="4" y="9.3" width="4" height="1.6" rx="0.8" fill="#F6A723" />
              <rect x="12" y="9.3" width="4" height="1.6" rx="0.8" fill="#F6A723" />
              <circle cx="10" cy="10" r="1.4" fill="#F6A723" />
            </svg>
          </span>
          <div>
            <p className="font-num text-base font-bold leading-none text-cream">Savings Trick</p>
            <p className="text-muted text-[0.65rem] mt-0.5">controle inteligente</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {ABAS.map(({ to, rotulo, Icone }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm font-semibold transition rounded-xl ${
                  isActive ? 'text-accent bg-accent/8' : 'text-muted hover:text-cream hover:bg-surface-2/60'
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent" />}
                  <Icone size={18} strokeWidth={isActive ? 2.3 : 1.9} />
                  {rotulo}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* COLUNA principal */}
      <div className="flex-1 min-w-0 flex flex-col h-full md:ml-64">
        {/* HEADER — no Início ele fica NAVY e cola no hero (efeito contínuo);
            nas outras páginas fica claro normal */}
        <header className={`shrink-0 z-20 ${noInicio ? '' : 'border-b border-line bg-bg/90 backdrop-blur'}`}
          style={noInicio ? { background: 'var(--color-navy)' } : undefined}>
          <div className="flex items-center justify-between px-5 md:px-8 pt-5 pb-3 max-w-5xl mx-auto w-full">
            <div>
              <p className={`text-xs uppercase tracking-[0.16em] md:hidden ${noInicio ? 'text-white/50' : 'text-muted'}`}>{APP_NAME}</p>
              <h1 className={`font-num text-2xl md:text-3xl ${noInicio ? 'text-white' : 'text-cream'}`}>{tituloAtual}</h1>
            </div>
            <Avisos />
          </div>
        </header>

        {/* MAIN — o único que rola. min-h-0 obrigatório. */}
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

        {/* BOTTOM NAV — mobile */}
        <nav className="md:hidden shrink-0 bg-surface border-t border-line">
          <div className="flex items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {ABAS.map(({ to, rotulo, Icone }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[0.68rem] transition ${isActive ? 'text-accent font-bold' : 'text-muted'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="navdot" className="absolute -top-0.5 h-1 w-1 rounded-full bg-accent" />}
                    <Icone size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                    {rotulo}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <RegistroRapido />
      <Onboarding />
      <SincronizadorNativo />
    </div>
  );
}
