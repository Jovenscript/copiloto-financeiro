// CRUD do Firestore para parcelamentos (users/{uid}/parcelamentos)
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const colecao = (uid) => collection(db, 'users', uid, 'parcelamentos');

export function ouvirParcelamentos(uid, callback) {
  const q = query(colecao(uid), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export function adicionar(uid, obj) { return addDoc(colecao(uid), obj); }
export function atualizar(uid, id, patch) { return updateDoc(doc(db, 'users', uid, 'parcelamentos', id), patch); }
export function remover(uid, id) { return deleteDoc(doc(db, 'users', uid, 'parcelamentos', id)); }
