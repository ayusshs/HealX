import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Building, Users, Shield, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import API_BASE from '../api';

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Hospital Form
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({ name: '', address: '', city: '', state: '', lat: '', lng: '' });

  // New Admin Form
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role: 'admin', hospitalId: '' });

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/superadmin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/superadmin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'hospitals') fetchHospitals();
    if (activeTab === 'admins') {
      fetchAdmins();
      fetchHospitals(); // Needed for hospital dropdown
    }
    setLoading(false);
  }, [activeTab]);

  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: hospitalForm.name,
        address: hospitalForm.address,
        location: {
          city: hospitalForm.city,
          state: hospitalForm.state,
          lat: parseFloat(hospitalForm.lat),
          lng: parseFloat(hospitalForm.lng)
        }
      };
      await axios.post(`${API_BASE}/api/superadmin/hospitals`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddHospital(false);
      setHospitalForm({ name: '', address: '', city: '', state: '', lat: '', lng: '' });
      fetchHospitals();
    } catch (err) {
      console.error(err);
      alert('Error creating hospital: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/superadmin/admins`, adminForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddAdmin(false);
      setAdminForm({ name: '', email: '', password: '', role: 'admin', hospitalId: '' });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating admin');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-xl">
        <div className="flex items-center gap-2">
          <Shield className="text-yellow-600 w-6 h-6" />
          <h1 className="text-2xl font-bold text-yellow-800">Superadmin Control Panel</h1>
        </div>
        <p className="text-yellow-700 text-sm mt-1 ml-8">God-mode access to manage the entire Healx platform.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Activity className="w-4 h-4 inline mr-2" /> Platform Overview
        </button>
        <button onClick={() => setActiveTab('hospitals')} className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'hospitals' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Building className="w-4 h-4 inline mr-2" /> Manage Hospitals
        </button>
        <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'admins' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4 inline mr-2" /> Admin Accounts
        </button>
      </div>

      <div className="py-6">
        {loading && <div className="text-center text-gray-500">Loading...</div>}

        {/* Dashboard Tab */}
        {!loading && activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Building size={32} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Hospitals</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_hospitals}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-full text-green-600"><Users size={32} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Patients</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_patients}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-full text-purple-600"><Activity size={32} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_appointments}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hospitals Tab */}
        {!loading && activeTab === 'hospitals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Network Hospitals</h2>
              <button onClick={() => setShowAddHospital(!showAddHospital)} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                <Plus size={16} /> Add Hospital
              </button>
            </div>

            {showAddHospital && (
              <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
                <h3 className="font-bold mb-4">Register New Hospital</h3>
                <form onSubmit={handleAddHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Hospital Name" value={hospitalForm.name} onChange={e => setHospitalForm({...hospitalForm, name: e.target.value})} className="border p-2 rounded" />
                  <input required placeholder="Address" value={hospitalForm.address} onChange={e => setHospitalForm({...hospitalForm, address: e.target.value})} className="border p-2 rounded" />
                  <input required placeholder="City" value={hospitalForm.city} onChange={e => setHospitalForm({...hospitalForm, city: e.target.value})} className="border p-2 rounded" />
                  <input required placeholder="State" value={hospitalForm.state} onChange={e => setHospitalForm({...hospitalForm, state: e.target.value})} className="border p-2 rounded" />
                  <input required type="number" step="any" placeholder="Latitude" value={hospitalForm.lat} onChange={e => setHospitalForm({...hospitalForm, lat: e.target.value})} className="border p-2 rounded" />
                  <input required type="number" step="any" placeholder="Longitude" value={hospitalForm.lng} onChange={e => setHospitalForm({...hospitalForm, lng: e.target.value})} className="border p-2 rounded" />
                  <div className="md:col-span-2">
                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded font-medium">Save Hospital</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">ID</th>
                    <th className="p-4 font-semibold text-gray-600">Name</th>
                    <th className="p-4 font-semibold text-gray-600">Location</th>
                    <th className="p-4 font-semibold text-gray-600">Rating</th>
                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map(h => (
                    <tr key={h.hospital_id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-mono text-xs">{h.hospital_id}</td>
                      <td className="p-4 font-medium">{h.name}</td>
                      <td className="p-4">{h.location?.city}, {h.location?.state}</td>
                      <td className="p-4">{h.rating || 'N/A'}</td>
                      <td className="p-4 flex gap-2">
                        <button className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {!loading && activeTab === 'admins' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Admin Accounts</h2>
              <button onClick={() => setShowAddAdmin(!showAddAdmin)} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                <Plus size={16} /> Create Admin
              </button>
            </div>

            {showAddAdmin && (
              <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
                <h3 className="font-bold mb-4">Create Admin Account</h3>
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Full Name" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="border p-2 rounded" />
                  <input required type="email" placeholder="Email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="border p-2 rounded" />
                  <input required type="password" placeholder="Password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="border p-2 rounded" />
                  <select required value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value, hospitalId: e.target.value === 'superadmin' ? '' : adminForm.hospitalId})} className="border p-2 rounded">
                    <option value="admin">Hospital Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  {adminForm.role === 'admin' && (
                    <select required value={adminForm.hospitalId} onChange={e => setAdminForm({...adminForm, hospitalId: e.target.value})} className="border p-2 rounded md:col-span-2">
                      <option value="">Select Hospital to Manage...</option>
                      {hospitals.map(h => <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>)}
                    </select>
                  )}
                  <div className="md:col-span-2">
                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded font-medium">Create Account</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Name</th>
                    <th className="p-4 font-semibold text-gray-600">Email</th>
                    <th className="p-4 font-semibold text-gray-600">Role</th>
                    <th className="p-4 font-semibold text-gray-600">Assigned Hospital</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a._id || a.email} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium">{a.name}</td>
                      <td className="p-4">{a.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${a.role === 'superadmin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {a.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-xs">{a.hospital_id || 'Global Access'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
