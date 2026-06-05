import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
const colecao = (uid) => collection(db, 'users', uid, 'compromissos');
export function ouvirCompromissos(uid, cb) {
  return onSnapshot(query(colecao(uid), orderBy('data', 'asc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export function adicionar(uid, o) { return addDoc(colecao(uid), o); }
export function remover(uid, id) { return deleteDoc(doc(db, 'users', uid, 'compromissos', id)); }
