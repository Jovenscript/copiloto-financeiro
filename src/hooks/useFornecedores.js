import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ouvirFornecedores, adicionar, atualizar, remover } from '../services/fornecedores';
export function useFornecedores() {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  useEffect(() => { if (!user) return; return ouvirFornecedores(user.uid, setFornecedores); }, [user]);
  return {
    fornecedores,
    adicionar: (o) => adicionar(user.uid, o),
    atualizar: (id, p) => atualizar(user.uid, id, p),
    remover: (id) => remover(user.uid, id),
  };
}
