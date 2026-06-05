import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Financas from './pages/Financas';
import Agenda from './pages/Compromissos';
import IA from './pages/IA';
import Perfil from './pages/Perfil';

// Porteiro: sem login -> tela de login. Com login -> o app.
function Portao() {
  const { user, carregando } = useAuth();

  if (carregando)
    return (
      <div className="min-h-full flex items-center justify-center">
        <span className="text-accent text-2xl animate-pulse">◑</span>
      </div>
    );

  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/financas" element={<Financas />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/ia" element={<IA />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Portao />
      </BrowserRouter>
    </AuthProvider>
  );
}
