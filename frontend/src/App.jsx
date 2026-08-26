import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearAuth, getDefaultRoute, getStoredAuth, storeAuth, updateStoredAuth } from './auth';
import api from './api';
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
import TherapistAvailabilityPage from './pages/TherapistAvailabilityPage';
import ProtectedRoute from './components/ProtectedRoute';
import CompletePatientProfile from './pages/CompletePatientProfile';
import WellnessBotPage from './pages/WellnessBotPage';
import FloatingChatbot from './components/FloatingChatbot';

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  useEffect(() => {
    if (auth) {
      api.get('/auth/verify')
        .catch(() => {
          logout();
        });
    }
  }, []);

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
    <>
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
        path="/wellness-bot"
        element={
          <ProtectedRoute auth={auth} allowedRoles={['patient']}>
            <WellnessBotPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book-session"
        element={
          <ProtectedRoute auth={auth}>
            <BookSessionPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute auth={auth}>
            <PatientProfilePage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-complaint"
        element={
          <ProtectedRoute auth={auth}>
            <NewComplaintPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-complaints"
        element={
          <ProtectedRoute auth={auth}>
            <MyComplaintsPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-followups"
        element={
          <ProtectedRoute auth={auth}>
            <Navigate to="/dashboard/patient?tab=followups" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-documents"
        element={
          <ProtectedRoute auth={auth}>
            <Navigate to="/dashboard/patient?tab=documents" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/patients/:patientId/assigned-therapies"
        element={
          <ProtectedRoute auth={auth} allowedRoles={['therapist']}>
            <AssignedTherapiesPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/assigned-therapies"
        element={
          <ProtectedRoute auth={auth} allowedRoles={['therapist']}>
            <TherapistAssignedTherapiesOverviewPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/availability"
        element={
          <ProtectedRoute auth={auth} allowedRoles={['therapist']}>
            <TherapistAvailabilityPage auth={auth} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
      </Routes>
      {auth && auth.role?.toLowerCase() === 'patient' && <FloatingChatbot auth={auth} />}
    </>
  );
}

export default App;