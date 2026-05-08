import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './components/auth/LoginPage';
import CadastroPage from './components/auth/CadastroPage';
import AtividadesPage from './components/atividades/AtividadesPage';
import AtividadeDetalhesPage from './components/atividades/AtividadeDetalhesPage';
import MinhasAtividadesPage from './components/minhas-atividades/MinhasAtividadesPage';
import ModeracaoPage from './components/moderacao/ModeracaoPage';
import ModeracaoDetalhesPage from './components/moderacao/ModeracaoDetalhesPage';
import UsuariosPage from './components/usuarios/UsuariosPage';
import PerfilPage from './components/perfil/PerfilPage';
import ChatPage from './components/chat/ChatPage';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.tipo < requiredRole) {
    return <Navigate to="/atividades" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/" element={<Navigate to="/atividades" replace />} />
      
      <Route element={<Layout />}>
        <Route 
          path="/atividades" 
          element={
            <ProtectedRoute>
              <AtividadesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/atividades/:id" 
          element={
            <ProtectedRoute>
              <AtividadeDetalhesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/minhas-atividades" 
          element={
            <ProtectedRoute>
              <MinhasAtividadesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/:atividadeId" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/moderacao"  
          element={
            <ProtectedRoute requiredRole={2}>
              <ModeracaoPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/moderacao/:id" 
          element={
            <ProtectedRoute requiredRole={2}>
              <ModeracaoDetalhesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute requiredRole={2}>
              <UsuariosPage />
            </ProtectedRoute>
          } 
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
