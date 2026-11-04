import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './components/auth/LoginPage';
import CadastroPage from './components/auth/CadastroPage';
import AtividadeDetalhesPage from './components/atividades/AtividadeDetalhesPage';
import ExplorarPage from './pages/ExplorarPage';
import OferecerPage from './pages/OferecerPage';
import PedirAjudaPage from './pages/PedirAjudaPage';
import MinhasHorasPage from './pages/MinhasHorasPage';
import ModeracaoPage from './components/moderacao/ModeracaoPage';
import ModeracaoDetalhesPage from './components/moderacao/ModeracaoDetalhesPage';
import UsuariosPage from './components/usuarios/UsuariosPage';
import PerfilPage from './components/perfil/PerfilPage';
import ChatPage from './components/chat/ChatPage';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex justify-center mt-20" role="status">
        <span className="text-texto-suave">Carregando sua conta...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.tipo < requiredRole) {
    return <Navigate to="/explorar" replace />;
  }

  return children;
};

// Endereços antigos continuam funcionando para quem guardou o link.
const RedirecionaTroca = () => {
  const { id, atividadeId } = useParams();
  return <Navigate to={`/trocas/${id ?? atividadeId}`} replace />;
};

const protegida = (elemento, papel) => <ProtectedRoute requiredRole={papel}>{elemento}</ProtectedRoute>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/" element={<Navigate to="/explorar" replace />} />

      <Route element={<Layout />}>
        <Route path="/explorar" element={protegida(<ExplorarPage />)} />
        <Route path="/oferecer" element={protegida(<OferecerPage />)} />
        <Route path="/trocas/:id/corrigir" element={protegida(<OferecerPage />)} />
        <Route path="/pedir-ajuda" element={protegida(<PedirAjudaPage />)} />
        <Route path="/minhas-horas" element={protegida(<MinhasHorasPage />)} />
        <Route path="/trocas/:id" element={protegida(<AtividadeDetalhesPage />)} />
        <Route path="/chat/:atividadeId" element={protegida(<ChatPage />)} />
        <Route path="/perfil" element={protegida(<PerfilPage />)} />
        <Route path="/moderacao" element={protegida(<ModeracaoPage />, 2)} />
        <Route path="/moderacao/:id" element={protegida(<ModeracaoDetalhesPage />, 2)} />
        <Route path="/usuarios" element={protegida(<UsuariosPage />, 2)} />
      </Route>

      <Route path="/atividades" element={<Navigate to="/explorar" replace />} />
      <Route path="/atividades/:id" element={<RedirecionaTroca />} />
      <Route path="/minhas-atividades" element={<Navigate to="/minhas-horas" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
