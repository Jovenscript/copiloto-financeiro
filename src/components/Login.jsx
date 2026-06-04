import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, APP_TAGLINE } from '../config';
import { FIREBASE_CONFIGURADO } from '../firebase';

export default function Login() {
  const { login, cadastrar } = useAuth();
  const [modo, setModo] = useState('login'); // login | cadastro
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setOcupado(true);
    try {
      if (modo === 'login') await login(email, senha);
      else await cadastrar(email, senha);
    } catch (err) {
      setErro(traduzErro(err.code));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* marca */}
        <div className="mb-10 text-center">
          <div className="text-accent text-3xl mb-3">◑</div>
          <h1 className="font-num text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted text-sm mt-1">{APP_TAGLINE}</p>
        </div>

        {!FIREBASE_CONFIGURADO && (
          <div className="mb-6 text-sm text-negative bg-negative/10 border border-negative/30 rounded-xl p-3">
            ⚠ Firebase ainda não configurado. Preencha <code>src/firebase.js</code>.
          </div>
        )}

        <form onSubmit={enviar} className="space-y-3">
          <input
            type="email"
            inputMode="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 outline-none focus:border-accent transition placeholder:text-muted/60"
            required
          />
          <input
            type="password"
            placeholder="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-3 outline-none focus:border-accent transition placeholder:text-muted/60"
            required
          />

          {erro && <p className="text-negative text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={ocupado}
            className="w-full bg-accent text-bg font-semibold rounded-xl px-4 py-3 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
          >
            {ocupado ? '...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); }}
          className="mt-6 w-full text-sm text-muted hover:text-cream transition"
        >
          {modo === 'login' ? 'Não tenho conta — criar' : 'Já tenho conta — entrar'}
        </button>
      </motion.div>
    </div>
  );
}

function traduzErro(code) {
  const m = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/user-not-found': 'Conta não encontrada.',
    'auth/email-already-in-use': 'Esse e-mail já tem conta.',
    'auth/weak-password': 'Senha muito curta (mín. 6).',
  };
  return m[code] || 'Algo deu errado. Tente de novo.';
}
