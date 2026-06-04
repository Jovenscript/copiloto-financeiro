import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Lancamentos from './pages/Lancamentos';
import Planejamento from './pages/Planejamento';
import Compromissos from './pages/Compromissos';
import Insights from './pages/Insights';

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
        <Route path="/lancamentos" element={<Lancamentos />} />
        <Route path="/planejamento" element={<Planejamento />} />
        <Route path="/compromissos" element={<Compromissos />} />
        <Route path="/insights" element={<Insights />} />
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
