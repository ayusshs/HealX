import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity } from 'lucide-react';
import API_BASE from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center mb-8">
        <Activity className="h-12 w-12 text-teal-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-500 text-sm">Login to manage your appointments</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            value={email} onChange={e => setEmail(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            value={password} onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors">
          Login
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account? <Link to="/signup" className="text-teal-600 font-semibold">Sign up</Link>
      </p>
    </div>
  );
}
