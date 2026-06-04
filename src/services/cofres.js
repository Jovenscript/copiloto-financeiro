// CRUD do Firestore para cofres (users/{uid}/cofres)
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const colecao = (uid) => collection(db, 'users', uid, 'cofres');

export function ouvirCofres(uid, callback) {
  const q = query(colecao(uid), orderBy('prioridade', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export function adicionar(uid, obj) { return addDoc(colecao(uid), obj); }
export function atualizar(uid, id, patch) { return updateDoc(doc(db, 'users', uid, 'cofres', id), patch); }
export function remover(uid, id) { return deleteDoc(doc(db, 'users', uid, 'cofres', id)); }
