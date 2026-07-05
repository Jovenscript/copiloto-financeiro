import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { useCompromissos } from '../hooks/useCompromissos';
import { gerarAvisos, chaveMes } from '../core/calculos';

const temNotif = typeof window !== 'undefined' && 'Notification' in window;

export default function Avisos() {
  const { lancamentos } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { cofres } = useCofres();
  const { compromissos } = useCompromissos();
  const [aberto, setAberto] = useState(false);
  const [permissao, setPermissao] = useState(temNotif ? Notification.permission : 'denied');

  const avisos = gerarAvisos({ lancs: lancamentos, recorrentes, parcelamentos, cofres, compromissos, ym: chaveMes() });
  const count = avisos.filter((a) => a.urgencia !== 'baixa').length;

  // Notificação do navegador (no máx 1x/dia) se permitido e houver aviso urgente
  useEffect(() => {
    if (permissao !== 'granted') return;
    const altos = avisos.filter((a) => a.urgencia === 'alta');
    if (!altos.length) return;
    const hoje = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem('aviso_notificado') === hoje) return;
      new Notification('Savings Trick', { body: `${altos[0].titulo} — ${altos[0].texto}` });
      localStorage.setItem('aviso_notificado', hoje);
    } catch (e) {}
  }, [avisos.length, permissao]);

  function ativar() {
    if (!temNotif) return;
    Notification.requestPermission().then((p) => setPermissao(p));
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="relative text-cream/80 hover:text-cream p-1.5 transition" aria-label="Avisos">
        <Bell size={22} />
        {count > 0 && (
          <span className="absolute -top-0.5 right-0 bg-negative text-white text-[0.6rem] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">{count}</span>
        )}
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-16"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAberto(false)}>
            <motion.div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-5"
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-num text-xl">🔔 Avisos</p>
                <button onClick={() => setAberto(false)} className="text-muted hover:text-cream text-2xl leading-none">×</button>
              </div>

              {temNotif && permissao !== 'granted' && (
                <button onClick={ativar} className="w-full mb-3 text-sm bg-accent/15 text-accent rounded-xl py-2.5 hover:bg-accent/25 transition">
                  🔔 Ativar avisos no navegador
                </button>
              )}

              {avisos.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">Tudo tranquilo por aqui. ✨</p>
              ) : (
                <div className="space-y-2">
                  {avisos.map((a, i) => (
                    <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${a.urgencia === 'alta' ? 'bg-negative/10 border border-negative/20' : 'bg-surface-2'}`}>
                      <span className="text-xl">{a.icone}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.titulo}</p>
                        <p className="text-muted text-xs">{a.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-muted/60 text-[0.7rem] mt-4">Pro celular vibrar com o app fechado, é a fase do app nativo (Capacitor).</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
