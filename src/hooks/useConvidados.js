import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirConvidados, adicionar, atualizar, remover } from '../services/convidados';
export function useConvidados() {
  const { user } = useAuth();
  const [convidados, setConvidados] = useState([]);
  useEffect(() => { if (!user) return; return ouvirConvidados(user.uid, setConvidados); }, [user]);
  return {
    convidados,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
