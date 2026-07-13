import { Navigate, useLocation, useParams } from 'react-router-dom';

export default function ProtectedRoute({ auth, children }) {
  const location = useLocation();
  const { role } = useParams();

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && role.toUpperCase() !== auth.role) {
    return <Navigate to={`/dashboard/${auth.role.toLowerCase()}`} replace />;
  }

  return children;
}
