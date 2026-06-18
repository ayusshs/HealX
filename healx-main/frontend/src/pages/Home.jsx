import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Clock, MapPin, MessageCircle, Phone, ChevronRight, CalendarCheck, Loader2, UserCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import API_BASE from '../api';

export default function Home() {
  const navigate = useNavigate();
  const [activeAppt, setActiveAppt] = useState(null);
  const [pastAppts, setPastAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    if (!token) { navigate('/login'); return; }
    try {
      const [activeRes, pastRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/patient/active-appointment`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/patient/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (activeRes.status === 'fulfilled') setActiveAppt(activeRes.value.data);
      else setActiveAppt(null);
      if (pastRes.status === 'fulfilled') setPastAppts(pastRes.value.data.filter(a => a.status !== 'pending'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => {
    fetchData();
    const socket = io(API_BASE);
    socket.on('queue_update', () => fetchData());
    return () => socket.disconnect();
  }, [fetchData]);

  const queueProgress = activeAppt
    ? Math.min(100, Math.round(((activeAppt.current_serving || 0) / (activeAppt.total_in_queue || 1)) * 100))
    : 0;

  const peopleAhead = activeAppt
    ? Math.max(0, (activeAppt.queue_number || 1) - (activeAppt.current_serving || 0) - 1)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">

      {/* ── LEFT: Profile Card ── */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 h-20 relative">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-16 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center">
              <span className="text-2xl font-black text-teal-600">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          </div>
          <div className="pt-10 pb-6 px-5 text-center">
            <h2 className="text-lg font-bold text-gray-800">{user?.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">{user?.patient_id}</p>
            <div className="space-y-2 text-left text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-700 text-xs">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium text-gray-700 capitalize">{user?.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${activeAppt ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {activeAppt ? '● In Queue' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Live Tracker + History ── */}
      <div className="md:col-span-2 space-y-5">

        {activeAppt ? (
          <div className="rounded-2xl overflow-hidden shadow-md">
            {/* Card Header */}
            <div className="bg-[#9bbdc2] px-6 pt-6 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    <span className="text-[#f395b1] font-black text-xl tracking-wide">Live Update</span>
                  </div>
                  <p className="text-white/70 text-xs">{activeAppt.department} · {activeAppt.hospital_id}</p>
                </div>
                <div className="bg-white rounded-full flex overflow-hidden shadow-sm text-sm font-bold">
                  <span className="px-3 py-1.5 text-gray-500 text-xs">Queue</span>
                  <span className="px-3 py-1.5 text-[#2db3e4] border-l border-gray-100">
                    {activeAppt.current_serving || 0}<span className="text-gray-300 mx-0.5">/</span>{activeAppt.total_in_queue || activeAppt.queue_number}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 mb-1">
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-700"
                    style={{ width: `${queueProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-white/60 text-[10px] mt-1">
                  <span>Start</span>
                  <span>{queueProgress}% served</span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="bg-[#9bbdc2] px-6 pb-6 flex gap-4 items-end">
              {/* Info fields */}
              <div className="flex-1 space-y-3">
                <div className="text-right text-white/60 text-[10px] -mb-1">now</div>
                {[
                  { label: 'Booking ID', val: activeAppt.booking_id },
                  { label: 'Slot', val: activeAppt.slot_time || '11:00 AM' },
                  { label: 'Name', val: user?.name },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <label className="text-white/80 text-[10px] font-medium block mb-0.5">{label}</label>
                    <div className="bg-[#7da8ae] text-gray-900 font-semibold px-3 py-2 rounded-lg text-sm">{val}</div>
                  </div>
                ))}
              </div>

              {/* Wait Time Box */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="bg-[#466af8] rounded-2xl p-4 text-white flex flex-col items-center justify-center text-center h-[115px] shadow-lg">
                  <Clock className="w-4 h-4 mb-0.5 opacity-70" />
                  <div className="text-2xl font-black leading-tight">{activeAppt.wait_time_predicted}</div>
                  <div className="text-xs opacity-70">mins estimated</div>
                  <div className="text-[9px] opacity-50 mt-0.5">{peopleAhead} ahead of you</div>
                </div>
                <Link to={`/receipt/${activeAppt.booking_id}`} className="bg-white text-teal-700 text-xs font-bold text-center py-2.5 rounded-xl hover:bg-teal-50 transition-colors shadow-sm block">
                  View Receipt Ticket
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center">
            <div className="bg-teal-50 p-4 rounded-full mb-4">
              <CalendarCheck className="h-8 w-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Active Appointment</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">Book an appointment to start live queue tracking right here.</p>
            <Link to="/hospitals" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 transition-colors font-semibold flex items-center gap-2">
              Find a Hospital <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Past Appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Past Appointments</h3>
            <span className="text-xs text-gray-400">{pastAppts.length} records</span>
          </div>
          {pastAppts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm italic">No past appointments found.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pastAppts.slice(0, 5).map(appt => (
                <div key={appt.booking_id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{appt.department}</p>
                    <p className="text-xs text-gray-400">{appt.booking_id} · {appt.slot_time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/receipt/${appt.booking_id}`} className="text-xs text-teal-600 hover:text-teal-800 hover:underline font-semibold">
                      Receipt
                    </Link>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      appt.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>{appt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Quick Actions ── */}
      <div className="md:col-span-1 space-y-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Quick Actions</h3>

        <Link to="/hospitals" className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-400 hover:shadow-md transition-all group">
          <div className="bg-teal-50 p-2.5 rounded-xl group-hover:bg-teal-600 transition-colors">
            <MapPin className="h-5 w-5 text-teal-600 group-hover:text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">Nearest Hospital</h4>
            <p className="text-xs text-gray-400">Find &amp; book instantly</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>

        <Link to="/chat" className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-400 hover:shadow-md transition-all group">
          <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-blue-600 transition-colors">
            <MessageCircle className="h-5 w-5 text-blue-500 group-hover:text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">Medical AI</h4>
            <p className="text-xs text-gray-400">Ask symptoms, get advice</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>

        <a href="tel:108" className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm hover:bg-red-100 transition-all group">
          <div className="bg-red-100 p-2.5 rounded-xl">
            <Phone className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-bold text-red-700 text-sm">Emergency</h4>
            <p className="text-xs text-red-400">Call Ambulance 108</p>
          </div>
        </a>

        {/* Queue Stats mini card (shown if active) */}
        {activeAppt && (
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 opacity-70" />
              <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Your Position</span>
            </div>
            <div className="text-3xl font-black">#{activeAppt.queue_number}</div>
            <div className="text-teal-200 text-xs mt-1">{activeAppt.department} dept.</div>
            <div className="mt-3 border-t border-white/20 pt-3 text-xs text-teal-100">
              Currently serving #{activeAppt.current_serving || 0}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
