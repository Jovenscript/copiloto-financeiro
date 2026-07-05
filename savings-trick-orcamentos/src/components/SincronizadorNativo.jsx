import { useEffect } from 'react';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCompromissos } from '../hooks/useCompromissos';
import { agendarLembretes, pedirPermissao, ajustarStatusBar } from '../native/notificacoes';
import { chaveMes } from '../core/calculos';

// Roda só efeitos (não renderiza nada). Agenda notificações nativas quando os dados mudam.
export default function SincronizadorNativo() {
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();
  const { compromissos } = useCompromissos();

  useEffect(() => { pedirPermissao(); ajustarStatusBar(); }, []);
  useEffect(() => {
    agendarLembretes({ recorrentes, parcelamentos, compromissos, ym: chaveMes() });
  }, [recorrentes, parcelamentos, compromissos]);

  return null;
}
