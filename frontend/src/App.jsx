import { Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { clearAuth, getDefaultRoute, getStoredAuth, storeAuth } from './auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const login = (data) => {
    storeAuth(data);
    setAuth(data);
  };

  const logout = () => {
    clearAuth();
    setAuth(null);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          auth ? <Navigate to={getDefaultRoute(auth.role)} replace /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={auth ? <Navigate to={getDefaultRoute(auth.role)} replace /> : <LoginPage onLogin={login} />}
      />
      <Route
        path="/register"
        element={auth ? <Navigate to={getDefaultRoute(auth.role)} replace /> : <RegisterPage onRegister={login} />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute auth={auth}>
            <DashboardPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
