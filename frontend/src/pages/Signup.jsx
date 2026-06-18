import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity } from 'lucide-react';
import API_BASE from '../api';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', gender: 'Male', phone: '', address: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/auth/signup`, formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center mb-8">
        <Activity className="h-12 w-12 text-teal-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
        <p className="text-gray-500 text-sm">Join HealX for smart healthcare</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 outline-none"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input required type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 outline-none"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input required type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 outline-none"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        </div>

        <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors mt-2">
          Sign Up
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-teal-600 font-semibold">Login</Link>
      </p>
    </div>
  );
}
