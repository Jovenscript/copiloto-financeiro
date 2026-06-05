import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirCartoes, adicionar, atualizar, remover } from '../services/cartoes';

export function useCartoes() {
  const { user } = useAuth();
  const [cartoes, setCartoes] = useState([]);
  useEffect(() => {
    if (!user) return;
    return ouvirCartoes(user.uid, setCartoes);
  }, [user]);
  return {
    cartoes,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
