import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const userRole = user.role || 'patient'; // Fallback
    
    // If no specific roles required, just needs to be logged in
    if (!allowedRoles || allowedRoles.length === 0) {
        return children;
    }

    if (allowedRoles.includes(userRole)) {
      return children;
    } else {
      // Redirect based on role if they try to access unauthorized route
      if (userRole === 'patient') return <Navigate to="/" replace />;
      if (userRole === 'admin') return <Navigate to="/admin" replace />;
      if (userRole === 'superadmin') return <Navigate to="/superadmin" replace />;
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
}
