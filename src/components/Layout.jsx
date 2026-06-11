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

// APP-SHELL: header e nav são partes fixas do layout (flex), só o <main> rola.
// Isso garante que a nav e o FAB sempre apareçam, independente da altura da
// página, de transforms de animação ou de quirks de WebView/PWA.
export default function Layout({ children }) {
  const loc = useLocation();
  const tituloAtual = ABAS.find((a) => a.to === loc.pathname)?.rotulo || APP_NAME;

  return (
    <div className="h-full flex overflow-hidden">
      {/* SIDEBAR — desktop only (em fluxo, ocupa altura cheia) */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r border-line bg-surface/40 px-4 py-6">
        <div className="px-2 mb-8">
          <p className="text-muted text-[0.65rem] uppercase tracking-[0.25em]">{APP_NAME}</p>
          <p className="font-num text-xl font-semibold mt-1">Copiloto</p>
        </div>
        <nav className="flex flex-col gap-1">
          {ABAS.map(({ to, rotulo, Icone }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:text-cream hover:bg-surface-2'}`}>
              <Icone size={20} /> {rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* COLUNA — header fixo + conteúdo rolável + nav fixa */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* HEADER — fica preso no topo (não rola) */}
        <header className="shrink-0 border-b border-line/60 bg-bg/80 backdrop-blur z-20">
          <div className="flex items-center justify-between px-5 md:px-8 pt-5 pb-3 max-w-5xl mx-auto w-full">
            <div>
              <p className="text-muted text-xs uppercase tracking-[0.2em] md:hidden">{APP_NAME}</p>
              <h1 className="font-num text-2xl md:text-3xl font-semibold tracking-tight">{tituloAtual}</h1>
            </div>
            <Avisos />
          </div>
        </header>

        {/* MAIN — o ÚNICO que rola. min-h-0 é obrigatório: sem ele o item
            flex não encolhe e o overflow não rola (a nav some cortada). */}
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

        {/* BOTTOM NAV — mobile, parte fixa do layout (em fluxo, sempre visível) */}
        <nav className="md:hidden shrink-0 bg-surface/95 backdrop-blur border-t border-line">
          <div className="flex items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {ABAS.map(({ to, rotulo, Icone }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[0.68rem] transition ${isActive ? 'text-accent' : 'text-muted hover:text-cream'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="navdot" className="absolute -top-0.5 h-1 w-1 rounded-full bg-accent" />}
                    <Icone size={21} strokeWidth={isActive ? 2.4 : 2} />
                    {rotulo}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Overlays / efeitos (FAB de lançar, onboarding, notificações nativas) */}
      <RegistroRapido />
      <Onboarding />
      <SincronizadorNativo />
    </div>
  );
}
