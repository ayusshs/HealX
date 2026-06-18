import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, User, Shield, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Re-renders on every route change

  // Re-read from localStorage on every navigation so state is always fresh
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    let u = null;
    try { u = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    setToken(t);
    setUser(u);
  }, [location.pathname]); // fires on every page navigation

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const role = user?.role || null;

  return (
    <nav className="bg-teal-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to={role === 'admin' ? '/admin' : role === 'superadmin' ? '/superadmin' : '/'} className="flex items-center space-x-2 text-2xl font-bold">
          <Activity className="h-8 w-8" />
          <span>HealX</span>
        </Link>

        <div className="flex items-center space-x-5">
          {/* Always visible */}
          <Link to="/hospitals" className="hover:text-teal-200 transition-colors text-sm font-medium">
            Search Hospitals
          </Link>

          {/* Patient-only links */}
          {token && (!role || role === 'patient') && (
            <Link to="/chat" className="hover:text-teal-200 transition-colors flex items-center gap-1 text-sm font-medium">
              <span className="bg-white text-teal-600 rounded-full px-2 py-0.5 text-xs font-bold">AI</span>
              Chat
            </Link>
          )}

          {/* Admin link */}
          {role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-1 hover:text-teal-200 transition-colors font-semibold text-sm">
              <LayoutDashboard className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          {/* Super Admin link */}
          {role === 'superadmin' && (
            <Link to="/superadmin" className="flex items-center gap-1 hover:text-yellow-200 transition-colors font-semibold text-yellow-200 text-sm">
              <Shield className="h-4 w-4" />
              Super Admin
            </Link>
          )}

          {/* Auth area */}
          {token ? (
            <div className="flex items-center gap-3">
              {/* Patient profile link */}
              {(!role || role === 'patient') && (
                <Link to="/profile" className="flex items-center gap-1.5 hover:text-teal-200 transition-colors">
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium hidden md:block">{user?.name}</span>
                </Link>
              )}

              {/* Admin / SuperAdmin name only */}
              {role && role !== 'patient' && (
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden md:block">{user?.name}</span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="bg-teal-700 hover:bg-red-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-white text-teal-600 hover:bg-teal-50 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
