import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirCompromissos, adicionar, remover } from '../services/compromissos';

export function useCompromissos() {
  const { user } = useAuth();
  const [compromissos, setCompromissos] = useState([]);
  useEffect(() => {
    if (!user) return;
    return ouvirCompromissos(user.uid, setCompromissos);
  }, [user]);
  return {
    compromissos,
    adicionar: (o) => adicionar(user.uid, o),
    remover: (id) => remover(user.uid, id),
  };
}
