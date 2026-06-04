import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirParcelamentos, adicionar, atualizar, remover } from '../services/parcelamentos';

export function useParcelamentos() {
  const { user } = useAuth();
  const [parcelamentos, setParcelamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    if (!user) return;
    const unsub = ouvirParcelamentos(user.uid, (l) => { setParcelamentos(l); setCarregando(false); });
    return unsub;
  }, [user]);
  return {
    parcelamentos, carregando,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
