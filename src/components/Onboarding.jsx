import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PASSOS = [
  { icone: '👋', titulo: 'Bem-vindo ao Savings Trick', txt: 'Seu assistente de finanças e rotina num lugar só. Bora num tour de 30 segundos.' },
  { icone: '🧭', titulo: '5 áreas, sem bagunça', txt: '🏠 Início: sua situação em segundos · 💰 Finanças: o dinheiro · 📅 Agenda: compromissos e contas · 🤖 IA: em breve · ⚙️ Perfil: você e backup.' },
  { icone: '🔴', titulo: 'Nunca mais esqueça uma conta', txt: 'Contas a vencer aparecem no topo e te cobram até você marcar Pago, Adiar ou Ignorar.' },
  { icone: '🚀', titulo: 'Pronto pra começar', txt: 'Dica: vá em Finanças → Lançar pra importar sua planilha ou registrar o primeiro gasto.' },
];

export default function Onboarding() {
  const [aberto, setAberto] = useState(() => {
    try { return localStorage.getItem('onboarded') !== 'true'; } catch { return false; }
  });
  const [i, setI] = useState(0);

  function fechar() {
    try { localStorage.setItem('onboarded', 'true'); } catch (e) {}
    setAberto(false);
  }
  function proximo() { i < PASSOS.length - 1 ? setI(i + 1) : fechar(); }

  const p = PASSOS[i];
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div className="fixed inset-0 z-[60] bg-bg/95 backdrop-blur flex items-center justify-center p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
            <div className="text-6xl mb-5">{p.icone}</div>
            <p className="font-num text-2xl mb-3">{p.titulo}</p>
            <p className="text-muted mb-8 leading-relaxed">{p.txt}</p>
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {PASSOS.map((_, idx) => <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-accent' : 'w-1.5 bg-line'}`} />)}
            </div>
            <button onClick={proximo} className="w-full bg-accent text-bg font-semibold rounded-2xl py-3.5 active:scale-[0.99] transition">
              {i < PASSOS.length - 1 ? 'Próximo' : 'Começar 🚀'}
            </button>
            {i < PASSOS.length - 1 && <button onClick={fechar} className="mt-3 text-muted text-sm">pular</button>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
