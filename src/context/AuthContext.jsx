// Contexto de autenticação: qualquer componente pega o usuário
// logado com useAuth(). Centraliza login/cadastro/logout.
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Firebase avisa sempre que o estado de login muda
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCarregando(false);
    });
    return unsub;
  }, []);

  const valor = {
    user,
    carregando,
    login: (email, senha) => signInWithEmailAndPassword(auth, email, senha),
    cadastrar: (email, senha) => createUserWithEmailAndPassword(auth, email, senha),
    sair: () => signOut(auth),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
