// ============================================================
// services/lancamentos.js — fala com o Firestore.
//
// Modelo limpo (≠ do app antigo que era 1 blob gigante):
//   users/{uid}/lancamentos/{id}
// Cada lançamento é um documento. Escala, é seguro pelas regras,
// e dá pra consultar/ordenar de verdade.
// ============================================================
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const colecao = (uid) => collection(db, 'users', uid, 'lancamentos');

// Tempo real: chama `callback(lista)` toda vez que muda. Devolve unsubscribe.
export function ouvirLancamentos(uid, callback) {
  const q = query(colecao(uid), orderBy('data', 'desc'));
  return onSnapshot(q, (snap) => {
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(lista);
  });
}

export function adicionarLancamento(uid, lancamento) {
  return addDoc(colecao(uid), lancamento);
}

export function removerLancamento(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'lancamentos', id));
}

export function atualizarLancamento(uid, id, patch) {
  return updateDoc(doc(db, 'users', uid, 'lancamentos', id), patch);
}
