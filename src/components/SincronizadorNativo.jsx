import { useEffect } from 'react';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useCompromissos } from '../hooks/useCompromissos';
import { agendarLembretes, pedirPermissao, ajustarStatusBar } from '../native/notificacoes';
import { chaveMes } from '../core/calculos';

// Roda só efeitos (não renderiza nada). Agenda notificações nativas quando os dados mudam.
export default function SincronizadorNativo() {
  const { recorrentes } = useRecorrentes();
  const { compromissos } = useCompromissos();

  useEffect(() => { pedirPermissao(); ajustarStatusBar(); }, []);
  useEffect(() => {
    agendarLembretes({ recorrentes, compromissos, ym: chaveMes() });
  }, [recorrentes, compromissos]);

  return null;
}
