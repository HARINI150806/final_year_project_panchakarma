import { Navigate, useLocation, useParams } from 'react-router-dom';

export default function ProtectedRoute({ auth, children, allowedRoles }) {
  const location = useLocation();
  const { role } = useParams();

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && role.toUpperCase() !== auth.role) {
    return <Navigate to={`/dashboard/${auth.role.toLowerCase()}`} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(auth.role.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}