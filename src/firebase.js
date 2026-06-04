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
  apiKey: 'COLE_AQUI',
  authDomain: 'SEU_PROJETO.firebaseapp.com',
  projectId: 'SEU_PROJETO',
  storageBucket: 'SEU_PROJETO.appspot.com',
  messagingSenderId: 'COLE_AQUI',
  appId: 'COLE_AQUI',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Sinaliza pro app se ainda está com placeholder (mostra aviso amigável)
export const FIREBASE_CONFIGURADO = firebaseConfig.apiKey !== 'COLE_AQUI';
