// Hook: dá pra qualquer página os lançamentos do usuário logado,
// já em tempo real. Component nenhum precisa saber de Firestore.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirLancamentos, adicionarLancamento, removerLancamento, atualizarLancamento } from '../services/lancamentos';

export function useLancamentos() {
  const { user } = useAuth();
  const [lancamentos, setLancamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user) return;
    setCarregando(true);
    const unsub = ouvirLancamentos(user.uid, (lista) => {
      setLancamentos(lista);
      setCarregando(false);
    });
    return unsub;
  }, [user]);

  return {
    lancamentos,
    carregando,
    adicionar: (l) => adicionarLancamento(user.uid, l),
    atualizar: (id, p) => atualizarLancamento(user.uid, id, p),
    remover: (id) => removerLancamento(user.uid, id),
  };
}
