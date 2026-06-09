import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
const col = (uid) => collection(db, 'users', uid, 'convidados');
export function ouvirConvidados(uid, cb) {
  return onSnapshot(query(col(uid), orderBy('criadoEm', 'asc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export function adicionar(uid, o) { return addDoc(col(uid), o); }
export function atualizar(uid, id, p) { return updateDoc(doc(db, 'users', uid, 'convidados', id), p); }
export function remover(uid, id) { return deleteDoc(doc(db, 'users', uid, 'convidados', id)); }
