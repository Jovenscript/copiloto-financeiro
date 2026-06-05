// firebase.js — conexão com o Firebase (Auth + Firestore)
// Config do Marlon já embutida. (apiKey de web Firebase é pública por design.)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB6rjNlFFxZFZAATL8s9UtnximvVi4leGs',
  authDomain: 'copiloto-financeiro-d6fae.firebaseapp.com',
  projectId: 'copiloto-financeiro-d6fae',
  storageBucket: 'copiloto-financeiro-d6fae.firebasestorage.app',
  messagingSenderId: '756580366680',
  appId: '1:756580366680:web:e391f7aacec324d02dcd2d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const FIREBASE_CONFIGURADO = true;
