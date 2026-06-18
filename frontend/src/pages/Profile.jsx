import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, Calendar, Pill, FileText, Settings, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react';
import API_BASE from '../api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // AI Report summary and upload states
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/patient/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
      // Auto-select first report if details panel is empty
      if (res.data.length > 0 && !selectedReport) {
        setSelectedReport(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching detailed reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/patient/upload_report`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      const fileInput = document.getElementById('report-file-input');
      if (fileInput) fileInput.value = '';
      fetchReports();
      fetchProfile(); // refresh basic profile counts
    } catch (err) {
      console.error("Failed to upload report:", err);
      alert("Failed to upload and analyze report. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setEditForm({
        name: res.data.name || '',
        gender: res.data.gender || '',
        dob: res.data.dob || '',
        bloodGroup: res.data.bloodGroup || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        aadhar: res.data.aadhar || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/api/patient/profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <div className="text-center p-8">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-start md:items-center gap-6">
        <div className="h-24 w-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
          <div className="text-gray-500 mt-1 flex gap-4">
            <span>ID: {profile.patient_id}</span>
            <span>•</span>
            <span>{profile.email}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium border border-teal-200">
              TSS Points: {profile.tss_points}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'basic', label: 'Basic Details', icon: User },
            { id: 'history', label: 'Checkup History', icon: Calendar },
            { id: 'medicines', label: 'Medicine History', icon: Pill },
            { id: 'reports', label: 'Bills & Reports', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-teal-600 text-teal-600 bg-teal-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Basic Details Tab */}
          {activeTab === 'basic' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium bg-teal-50 px-4 py-2 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <input type="text" value={editForm.bloodGroup} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar / ID Number</label>
                    <input type="text" value={editForm.aadhar} onChange={e => setEditForm({...editForm, aadhar: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" rows="2" />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-2">
                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 font-medium shadow-sm">Save Changes</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <DetailItem label="Full Name" value={profile.name} />
                  <DetailItem label="Date of Birth" value={profile.dob} />
                  <DetailItem label="Gender" value={profile.gender} />
                  <DetailItem label="Blood Group" value={profile.bloodGroup} />
                  <DetailItem label="Phone" value={profile.phone} />
                  <DetailItem label="Aadhar / ID" value={profile.aadhar} />
                  <div className="md:col-span-2">
                    <DetailItem label="Address" value={profile.address} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checkup History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Appointment History</h2>
              {profile.appointments.length === 0 ? (
                <p className="text-gray-500">No past appointments found.</p>
              ) : (
                <div className="space-y-4">
                  {profile.appointments.map((appt, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{appt.department} Consultation</h3>
                          <p className="text-gray-600 mt-1">Hospital ID: {appt.hospital_id}</p>
                          <p className="text-sm text-gray-500 mt-2 flex gap-4">
                            <span>📅 {new Date(appt.booked_at).toLocaleDateString()}</span>
                            <span>⏰ {appt.slot_time || 'N/A'}</span>
                            <span>#️⃣ {appt.booking_id}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={appt.status} />
                          <Link to={`/receipt/${appt.booking_id}`} className="text-xs text-teal-650 hover:text-teal-800 hover:underline font-semibold bg-teal-50/50 px-2.5 py-1.5 rounded-lg border border-teal-150 transition-colors">
                            View Ticket
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medicines Tab */}
          {activeTab === 'medicines' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Medicine History</h2>
              {profile.medicines.length === 0 ? (
                <p className="text-gray-500">No medicines prescribed yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.medicines.map((med, idx) => (
                    <div key={idx} className="border border-teal-100 bg-teal-50/30 rounded-lg p-4">
                      <h3 className="font-bold text-teal-800">{med.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{med.dosage} - {med.frequency}</p>
                      <p className="text-gray-500 text-xs mt-2">Duration: {med.duration} days</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left Column: Upload & List */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Report</h2>
                  <p className="text-sm text-gray-500 mb-4">Upload lab test results, prescriptions, or scan reports (PDF or images) to analyze them.</p>
                  
                  <form onSubmit={handleUpload} className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4">
                    <input 
                      type="file" 
                      id="report-file-input" 
                      accept=".pdf,.png,.jpg,.jpeg,.webp" 
                      onChange={e => setFile(e.target.files[0])}
                      className="hidden"
                    />
                    <label 
                      htmlFor="report-file-input" 
                      className="cursor-pointer bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-teal-600" />
                      {file ? file.name : 'Choose PDF or Image'}
                    </label>
                    <button 
                      type="submit" 
                      disabled={uploading || !file} 
                      className="w-full bg-teal-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {uploading ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Processing OCR & AI...
                        </>
                      ) : 'Upload & Analyze Report'}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Uploaded Documents ({reports.length})
                  </h3>
                  {loadingReports ? (
                    <div className="text-center py-6 text-gray-500 text-sm">Loading reports...</div>
                  ) : reports.length === 0 ? (
                    <p className="text-gray-400 text-sm">No reports uploaded yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {reports.map((rep, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedReport(rep)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedReport?._id === rep._id 
                              ? 'border-teal-500 bg-teal-50/50 shadow-sm' 
                              : 'border-gray-250 hover:border-gray-300 bg-white hover:bg-gray-50/20'
                          }`}
                        >
                          <h4 className="font-bold text-sm text-gray-800 break-all">{rep.filename}</h4>
                          <p className="text-xs text-gray-400 mt-2">
                            📅 {new Date(rep.uploaded_at).toLocaleDateString()} at {new Date(rep.uploaded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Analysis details */}
              <div className="md:col-span-3">
                {selectedReport ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="border-b pb-4">
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">AI Insight Card</span>
                      <h3 className="font-bold text-xl text-gray-800 mt-3 break-all">{selectedReport.filename}</h3>
                      <p className="text-xs text-gray-400 mt-1">Uploaded: {new Date(selectedReport.uploaded_at).toLocaleString()}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Clinical Summary Report</h4>
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedReport.ai_summary}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <details className="group border rounded-lg overflow-hidden bg-white">
                        <summary className="cursor-pointer font-bold text-xs text-gray-500 hover:text-gray-700 p-3 bg-gray-50 select-none flex justify-between items-center group-open:border-b">
                          <span>VIEW RAW EXTRACTED TEXT (OCR REFERENCE)</span>
                          <span className="transition-transform group-open:rotate-180">▼</span>
                        </summary>
                        <div className="p-4 text-xs text-gray-500 font-mono bg-gray-50/30 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                          {selectedReport.extracted_text}
                        </div>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="h-full border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-gray-50/20 min-h-[300px]">
                    <FileText className="w-12 h-12 text-gray-300 mb-3" />
                    <h4 className="font-bold text-gray-700 mb-1">Select a Report</h4>
                    <p className="text-sm text-gray-400 max-w-xs">Pick a document from the left list to review its AI-generated medical summary and OCR outputs.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-gray-900 font-medium mt-1">{value || '-'}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const getColors = () => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
      case 'upcoming': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getColors()}`}>
      {status}
    </span>
  );
}
