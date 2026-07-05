import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirOrcamentos, adicionar, atualizar, remover } from '../services/orcamentos';

export function useOrcamentos() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState([]);
  useEffect(() => {
    if (!user) return;
    return ouvirOrcamentos(user.uid, setOrcamentos);
  }, [user]);
  return {
    orcamentos,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
