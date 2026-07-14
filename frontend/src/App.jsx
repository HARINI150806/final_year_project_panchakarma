import { Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { clearAuth, getDefaultRoute, getStoredAuth, storeAuth, updateStoredAuth } from './auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DoshaAssessmentPage from './pages/DoshaAssessmentPage';
import BookSessionPage from './pages/BookSessionPage';
import PatientProfilePage from './pages/PatientProfilePage';
import NewComplaintPage from './pages/NewComplaintPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import AssignedTherapiesPage from './pages/AssignedTherapiesPage';
import TherapistAssignedTherapiesOverviewPage from './pages/TherapistAssignedTherapiesOverviewPage';
import ProtectedRoute from './components/ProtectedRoute';
import CompletePatientProfile from './pages/CompletePatientProfile';

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

  const updateAuth = (updates) => {
    const updated = updateStoredAuth(updates);
    setAuth(updated);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={auth ? <Navigate to={getDefaultRoute(auth.role, auth.profileCompleted)} replace /> : <HomePage />}
      />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute auth={auth}>
            <CompletePatientProfile auth={auth} onAuthUpdate={updateAuth} />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/login"
        element={auth ? <Navigate to={getDefaultRoute(auth.role, auth.profileCompleted)} replace /> : <LoginPage onLogin={login} />}
      />
      <Route
        path="/register"
        element={auth ? <Navigate to={getDefaultRoute(auth.role, auth.profileCompleted)} replace /> : <RegisterPage onRegister={login} />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute auth={auth}>
            <DashboardPage auth={auth} onLogout={logout} onAuthUpdate={updateAuth} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dosha-assessment"
        element={
          <ProtectedRoute auth={auth}>
            <DoshaAssessmentPage auth={auth} onAuthUpdate={updateAuth} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book-session"
        element={
          <ProtectedRoute auth={auth}>
            <BookSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute auth={auth}>
            <PatientProfilePage auth={auth} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-complaint"
        element={
          <ProtectedRoute auth={auth}>
            <NewComplaintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-complaints"
        element={
          <ProtectedRoute auth={auth}>
            <MyComplaintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/patients/:patientId/assigned-therapies"
        element={
          <ProtectedRoute auth={auth} allowedRoles={['therapist']}>
            <AssignedTherapiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/assigned-therapies"
        element={
          <ProtectedRoute auth={auth} allowedRoles={['therapist']}>
            <TherapistAssignedTherapiesOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
      </Routes>
  );
}

export default App;