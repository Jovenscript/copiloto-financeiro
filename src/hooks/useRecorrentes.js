import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirRecorrentes, adicionar, atualizar, remover } from '../services/recorrentes';

export function useRecorrentes() {
  const { user } = useAuth();
  const [recorrentes, setRecorrentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    if (!user) return;
    const unsub = ouvirRecorrentes(user.uid, (l) => { setRecorrentes(l); setCarregando(false); });
    return unsub;
  }, [user]);
  return {
    recorrentes, carregando,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
