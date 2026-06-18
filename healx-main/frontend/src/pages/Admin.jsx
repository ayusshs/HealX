import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Download, Users, CheckCircle, Activity, ClipboardList,
  TrendingUp, Clock, RefreshCw, ChevronRight, Loader2, Building2, UserPlus, Stethoscope,
  MessageSquare, Sparkles
} from 'lucide-react';
import API_BASE from '../api';

const STATUS_COLORS = {
  pending:   'bg-amber-50 text-amber-600 border border-amber-200',
  completed: 'bg-green-50 text-green-600 border border-green-200',
  cancelled: 'bg-red-50 text-red-500 border border-red-200',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // New Doctor Form
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialty: '', experience: '', qualifications: '' });

  // New Department Form
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', head: '' });

  // Feedback Analytics & AI Summary States
  const [feedbackAnalytics, setFeedbackAnalytics] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientSummary, setPatientSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const fetchFeedbackAnalytics = async () => {
    setLoadingFeedback(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/feedback_analytics`);
      setFeedbackAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleViewPatientSummary = async (patientId) => {
    setSelectedPatientId(patientId);
    setShowSummaryModal(true);
    setLoadingSummary(true);
    setPatientSummary('');
    try {
      const res = await axios.get(`${API_BASE}/api/admin/patient/${patientId}/ai_summary`);
      setPatientSummary(res.data.summary);
    } catch (err) {
      setPatientSummary('Failed to retrieve AI clinical briefing. Please review records manually.');
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const hospId = user.hospitalId || 'HOSP-001';
      
      const [apptRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/appointments?status=${statusFilter}&hospital_id=${hospId}`),
        axios.get(`${API_BASE}/api/admin/analytics?hospital_id=${hospId}`),
      ]);
      setAppointments(apptRes.data);
      setAnalytics(analyticsRes.data);
      
      if (user.hospitalId) {
        const hospRes = await axios.get(`${API_BASE}/api/hospital/${user.hospitalId}`);
        setHospital(hospRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
    // Live sync: when admin serves next it should auto-update
    const socket = io(API_BASE);
    socket.on('queue_update', () => fetchData(true));
    return () => socket.disconnect();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedbackAnalytics();
    }
  }, [activeTab]);

  const updateStatus = async (bookingId, newStatus) => {
    await axios.put(`${API_BASE}/api/admin/appointments/${bookingId}/status`, { status: newStatus });
    fetchData(true);
  };

  const serveNext = async (hospitalId, department) => {
    await axios.post(`${API_BASE}/api/admin/queue/serve`, { hospital_id: hospitalId, department });
    fetchData(true);
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (hospital) {
      const newDoctor = {
        ...doctorForm,
        doctorId: 'DOC' + Date.now(),
        slots: ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM']
      };
      const updatedDoctors = [...(hospital.doctors || []), newDoctor];
      
      try {
        const res = await axios.put(`${API_BASE}/api/hospital/${hospital.hospital_id}`, {
          doctors: updatedDoctors
        });
        setHospital(res.data);
        setShowAddDoctor(false);
        setDoctorForm({ name: '', specialty: '', experience: '', qualifications: '' });
      } catch (err) {
        console.error(err);
        alert('Failed to save doctor to database.');
      }
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (hospital) {
      const updatedSpecs = [...(hospital.specialties || []), deptForm.name];
      
      try {
        const res = await axios.put(`${API_BASE}/api/hospital/${hospital.hospital_id}`, {
          specialties: updatedSpecs
        });
        setHospital(res.data);
        setShowAddDept(false);
        setDeptForm({ name: '', head: '' });
      } catch (err) {
        console.error(err);
        alert('Failed to save department to database.');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
        <p className="text-gray-400 text-sm">Loading admin data…</p>
      </div>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pending').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-7">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hospital Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage {hospital?.name || 'your hospital'} in real-time</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => window.open('http://localhost:5000/api/admin/export', '_blank')}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-teal-700 transition-colors shadow-sm">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Queues', icon: Activity },
          { id: 'appointments', label: 'Appointments', icon: ClipboardList },
          { id: 'doctors', label: 'Doctors', icon: Stethoscope },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'feedback', label: 'Feedback Insights', icon: MessageSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stat Cards */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Appointments', value: analytics.total_appointments, icon: <ClipboardList size={20}/>, color: 'from-teal-500 to-teal-600' },
                { label: 'Active Queues', value: analytics.queues.length, icon: <Activity size={20}/>, color: 'from-blue-500 to-blue-600' },
                { label: 'Pending Today', value: pending, icon: <Clock size={20}/>, color: 'from-amber-400 to-amber-500' },
                { label: 'Completed Today', value: completed, icon: <CheckCircle size={20}/>, color: 'from-green-500 to-green-600' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={`bg-gradient-to-br ${color} text-white p-3 rounded-xl shadow-sm`}>{icon}</div>
                  <div>
                    <p className="text-gray-400 text-xs">{label}</p>
                    <h3 className="text-2xl font-black text-gray-800">{value}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Queue Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden max-w-4xl">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <h2 className="font-bold text-gray-800">Live Queues</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics?.queues.map((q, i) => {
                const pct = q.total_in_queue > 0 ? Math.round((q.current_serving / q.total_in_queue) * 100) : 0;
                const remaining = Math.max(0, q.total_in_queue - q.current_serving);
                const estFinish = remaining * q.avg_time_per_patient;
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-teal-200 transition-all bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{q.department}</h3>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{q.hospital_id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-teal-600 font-black text-sm">{q.current_serving}<span className="text-gray-300 mx-0.5">/</span>{q.total_in_queue}</div>
                        <div className="text-gray-400 text-[10px]">~{estFinish} min left</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400">{remaining} remaining · {q.avg_time_per_patient} min/patient</span>
                      <button
                        onClick={() => serveNext(q.hospital_id, q.department)}
                        disabled={q.current_serving >= q.total_in_queue}
                        className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        <ChevronRight size={12} /> Serve Next
                      </button>
                    </div>
                  </div>
                );
              })}
              {(!analytics || analytics.queues.length === 0) && (
                <p className="col-span-2 text-center text-gray-400 italic py-8 text-sm">No active queues right now.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
          <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <h2 className="font-bold text-gray-800">Appointments Management</h2>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-xs font-semibold">
              {['all', 'pending', 'completed', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${statusFilter === s ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-800'}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Dept</th>
                  <th className="px-6 py-3">Queue #</th>
                  <th className="px-6 py-3">Wait</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions & AI Briefing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(appt => (
                  <tr key={appt.booking_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{appt.booking_id}</span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-xs">{appt.patient_id}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-gray-800">{appt.department}</div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-800">#{appt.queue_number}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{appt.wait_time_predicted} min</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[appt.status] || ''}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 flex items-center gap-2">
                      <button onClick={() => handleViewPatientSummary(appt.patient_id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Sparkles size={12} /> AI Briefing
                      </button>
                      {appt.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(appt.booking_id, 'completed')}
                            className="text-xs font-semibold text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded-lg transition-colors">
                            Done
                          </button>
                          <button onClick={() => updateStatus(appt.booking_id, 'cancelled')}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-lg transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400 italic">No appointments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Manage Doctors</h2>
            <button onClick={() => setShowAddDoctor(!showAddDoctor)} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors">
              <UserPlus size={16} /> Add Doctor
            </button>
          </div>

          {showAddDoctor && (
            <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
              <h3 className="font-bold mb-4">Add New Doctor</h3>
              <form onSubmit={handleAddDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Doctor Name (e.g. Dr. John Doe)" value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} className="border p-2 rounded" />
                <select required value={doctorForm.specialty} onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})} className="border p-2 rounded">
                  <option value="">Select Specialty</option>
                  {hospital?.specialties?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Experience (e.g. 10 years)" value={doctorForm.experience} onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})} className="border p-2 rounded" />
                <input placeholder="Qualifications (e.g. MBBS, MD)" value={doctorForm.qualifications} onChange={e => setDoctorForm({...doctorForm, qualifications: e.target.value})} className="border p-2 rounded" />
                <div className="md:col-span-2">
                  <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded font-medium">Save Doctor</button>
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
                  <th className="p-4 font-semibold text-gray-600">Specialty</th>
                  <th className="p-4 font-semibold text-gray-600">Qualifications</th>
                </tr>
              </thead>
              <tbody>
                {hospital?.doctors?.map(d => (
                  <tr key={d.doctorId} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs">{d.doctorId}</td>
                    <td className="p-4 font-medium">{d.name}</td>
                    <td className="p-4">{d.specialty}</td>
                    <td className="p-4 text-gray-500">{d.qualifications || 'N/A'}</td>
                  </tr>
                ))}
                {(!hospital?.doctors || hospital.doctors.length === 0) && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">No doctors added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Manage Departments</h2>
            <button onClick={() => setShowAddDept(!showAddDept)} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors">
              <Building2 size={16} /> Add Department
            </button>
          </div>

          {showAddDept && (
            <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
              <h3 className="font-bold mb-4">Add New Department</h3>
              <form onSubmit={handleAddDept} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Department Name (e.g. Cardiology)" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} className="border p-2 rounded" />
                <input placeholder="Head of Department" value={deptForm.head} onChange={e => setDeptForm({...deptForm, head: e.target.value})} className="border p-2 rounded" />
                <div className="md:col-span-2">
                  <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded font-medium">Save Department</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hospital?.specialties?.map(dept => (
              <div key={dept} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-full text-teal-600">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{dept}</h3>
                  <p className="text-sm text-gray-500">{hospital.doctors?.filter(d => d.specialty === dept).length || 0} Doctors</p>
                </div>
              </div>
            ))}
            {(!hospital?.specialties || hospital.specialties.length === 0) && (
              <p className="col-span-3 text-center text-gray-500 py-8">No departments defined.</p>
            )}
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Feedback Sentiment Insights</h2>
              <p className="text-gray-400 text-sm mt-0.5">Real-time analysis of patient reviews using Naive Bayes classifier</p>
            </div>
            <button onClick={fetchFeedbackAnalytics} className="flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-xl font-medium text-sm hover:bg-teal-100 transition-colors">
              <RefreshCw size={14} className={loadingFeedback ? 'animate-spin' : ''} /> Reload Feedback
            </button>
          </div>

          {loadingFeedback ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : feedbackAnalytics ? (
            <div className="space-y-6">
              {/* Sentiment Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                  <p className="text-gray-400 text-xs font-semibold uppercase">Total Reviews</p>
                  <h3 className="text-3xl font-black text-gray-800 mt-2">{feedbackAnalytics.total_reviews}</h3>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-green-600 text-xs font-semibold uppercase">Positive Reviews</p>
                  <h3 className="text-3xl font-black text-green-700 mt-2">{feedbackAnalytics.sentiment_distribution?.positive || 0}</h3>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-amber-600 text-xs font-semibold uppercase">Neutral Reviews</p>
                  <h3 className="text-3xl font-black text-amber-700 mt-2">{feedbackAnalytics.sentiment_distribution?.neutral || 0}</h3>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-red-500 text-xs font-semibold uppercase">Negative Reviews</p>
                  <h3 className="text-3xl font-black text-red-700 mt-2">{feedbackAnalytics.sentiment_distribution?.negative || 0}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Topic Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:col-span-1">
                  <h3 className="font-bold text-gray-800 mb-4">Issues by Topic</h3>
                  <div className="space-y-3 flex-1">
                    {Object.entries(feedbackAnalytics.common_issues_by_topic || {}).map(([topic, count]) => (
                      <div key={topic} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600 font-medium">{topic}</span>
                        <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">{count} flags</span>
                      </div>
                    ))}
                    {Object.keys(feedbackAnalytics.common_issues_by_topic || {}).length === 0 && (
                      <p className="text-gray-400 italic text-sm">No specific topics categorized.</p>
                    )}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm md:col-span-2">
                  <h3 className="font-bold text-gray-800 mb-4">Patient Reviews & Classifications</h3>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {feedbackAnalytics.reviews?.map((r, i) => (
                      <div key={i} className="border border-gray-50 bg-gray-50/20 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-400">Dept: {r.department}</span>
                          <div className="flex gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              r.sentiment === 'positive' ? 'bg-green-50 text-green-600 border-green-200' :
                              r.sentiment === 'negative' ? 'bg-red-50 text-red-500 border-red-200' :
                              'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>{r.sentiment}</span>
                            {r.topics?.map(t => (
                              <span key={t} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-150 px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed italic">"{r.text}"</p>
                      </div>
                    ))}
                    {(!feedbackAnalytics.reviews || feedbackAnalytics.reviews.length === 0) && (
                      <p className="text-gray-400 italic text-center py-8">No feedback reviews recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Could not retrieve feedback analytics. Try reloading.</p>
          )}
        </div>
      )}

      {/* Patient AI Briefcase Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg">Patient AI Briefcase</h3>
                  <p className="text-xs text-blue-100">Patient ID: {selectedPatientId}</p>
                </div>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="text-white hover:text-blue-200 font-bold text-lg px-2.5 py-1 bg-white/10 rounded-lg">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm text-gray-500">Generating AI Clinical Briefing...</p>
                </div>
              ) : (
                <div className="prose prose-teal max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                  {patientSummary}
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowSummaryModal(false)} className="bg-gray-950 text-white font-semibold px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
