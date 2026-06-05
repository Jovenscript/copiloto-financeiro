import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirEnvelopes, adicionar, atualizar, remover } from '../services/envelopes';

export function useEnvelopes() {
  const { user } = useAuth();
  const [envelopes, setEnvelopes] = useState([]);
  useEffect(() => {
    if (!user) return;
    return ouvirEnvelopes(user.uid, setEnvelopes);
  }, [user]);
  return {
    envelopes,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
