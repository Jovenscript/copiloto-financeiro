import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirCofres, adicionar, atualizar, remover } from '../services/cofres';

export function useCofres() {
  const { user } = useAuth();
  const [cofres, setCofres] = useState([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    if (!user) return;
    const unsub = ouvirCofres(user.uid, (l) => { setCofres(l); setCarregando(false); });
    return unsub;
  }, [user]);
  return {
    cofres, carregando,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
