// ============================================================
// firebase.js — conexão com o Firebase (Auth + Firestore)
//
// COMO PREENCHER (5 min):
//   1. console.firebase.google.com -> criar projeto (ou usar um seu)
//   2. Adicionar app Web (</>) -> copiar o firebaseConfig
//   3. Colar abaixo no lugar do placeholder
//   4. No console: Authentication -> ativar "E-mail/senha"
//   5. No console: Firestore Database -> criar (modo produção)
//      e colar as regras do arquivo firestore.rules
//
// DICA: em projeto profissional isso vai pra variáveis de ambiente
// (.env com VITE_FIREBASE_*). Por ora, inline resolve.
// ============================================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6rjNlFFxZFZAATL8s9UtnximvVi4leGs",
  authDomain: "copiloto-financeiro-d6fae.firebaseapp.com",
  projectId: "copiloto-financeiro-d6fae",
  storageBucket: "copiloto-financeiro-d6fae.firebasestorage.app",
  messagingSenderId: "756580366680",
  appId: "1:756580366680:web:e391f7aacec324d02dcd2d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Sinaliza pro app se ainda está com placeholder (mostra aviso amigável)
export const FIREBASE_CONFIGURADO = firebaseConfig.apiKey !== 'COLE_AQUI';
