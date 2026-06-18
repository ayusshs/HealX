import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock, Calendar as CalendarIcon, User, CreditCard } from 'lucide-react';
import API_BASE from '../api';

export default function BookAppointment() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    doctor_id: '',
    date: '',
    slot_time: '',
    type: 'In-Person',
    symptoms: '',
    paymentMode: 'Cash'
  });

  useEffect(() => {
    // Pre-fill user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setFormData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));

    // Fetch hospital details
    const fetchHospital = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/hospital/${hospitalId}`);
        setHospital(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHospital();
  }, [hospitalId]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getAvailableDoctors = () => {
    if (!hospital || !formData.department) return [];
    return hospital.doctors.filter(d => d.specialty === formData.department);
  };

  const getAvailableSlots = () => {
    if (!formData.doctor_id) return [];
    const doc = hospital.doctors.find(d => d.doctorId === formData.doctor_id || d.name === formData.doctor_id);
    return doc ? doc.slots : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        hospital_id: hospitalId,
        department: formData.department,
        doctor_id: formData.doctor_id,
        slot_time: formData.slot_time,
        type: formData.type,
        symptoms: formData.symptoms,
        paymentMode: formData.paymentMode,
      };

      const res = await axios.post(`${API_BASE}/api/patient/book`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointmentId = res.data.appointment.booking_id;
      navigate(`/receipt/${appointmentId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!hospital) return <div className="p-8 text-center">Loading hospital details...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Book Appointment</h1>
        <p className="text-gray-500 mt-2">{hospital.name} • {hospital.address}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step >= i ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i}
            </div>
            {i < 3 && <div className={`flex-1 h-1 mx-2 ${step > i ? 'bg-teal-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (step === 2 && !formData.slot_time) {
            alert('Please select a preferred time slot before continuing.');
            return;
          }
          if (step === 3) {
            handleSubmit(e);
          } else {
            setStep(step + 1);
          }
        }}>
          
          {/* STEP 1: Personal */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User className="text-teal-600" /> Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (10 digits)</label>
                  <input required pattern="[0-9]{10}" title="Must be 10 digits" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-2 focus:ring-teal-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint / Symptoms (min 10 chars)</label>
                  <textarea required minLength={10} name="symptoms" value={formData.symptoms} onChange={handleChange} rows="3" className="w-full border rounded-lg p-2 focus:ring-teal-500"></textarea>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Medical */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Clock className="text-teal-600" /> Appointment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select required name="department" value={formData.department} onChange={handleChange} className="w-full border rounded-lg p-2 focus:ring-teal-500">
                    <option value="">Select Department</option>
                    {hospital.specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Doctor</label>
                  <select required name="doctor_id" value={formData.doctor_id} onChange={handleChange} disabled={!formData.department} className="w-full border rounded-lg p-2 focus:ring-teal-500 disabled:bg-gray-100">
                    <option value="">Select Doctor</option>
                    {getAvailableDoctors().map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
                  <select required name="type" value={formData.type} onChange={handleChange} className="w-full border rounded-lg p-2 focus:ring-teal-500">
                    <option value="In-Person">In-Person</option>
                    <option value="Video Consult">Video Consult</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input required type="date" name="date" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={handleChange} className="w-full border rounded-lg p-2 focus:ring-teal-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableSlots().length > 0 ? getAvailableSlots().map(slot => (
                      <button type="button" key={slot} onClick={() => setFormData({...formData, slot_time: slot})} className={`px-4 py-2 rounded-lg border transition-colors ${formData.slot_time === slot ? 'bg-teal-600 text-white border-teal-600' : 'hover:border-teal-600 hover:text-teal-600'}`}>
                        {slot}
                      </button>
                    )) : <p className="text-gray-500 text-sm">Select a doctor to view slots</p>}
                  </div>
                  {/* Hidden input to ensure slot is selected if form is required */}
                  <input type="hidden" required value={formData.slot_time} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Admin & Payment */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><CreditCard className="text-teal-600" /> Payment & Admin</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Cash', 'Card', 'UPI', 'Insurance'].map(mode => (
                    <button type="button" key={mode} onClick={() => setFormData({...formData, paymentMode: mode})} className={`py-3 rounded-lg border font-medium transition-colors flex items-center justify-center gap-2 ${formData.paymentMode === mode ? 'bg-teal-50 border-teal-600 text-teal-700' : 'hover:border-teal-400'}`}>
                      {formData.paymentMode === mode && <CheckCircle className="w-4 h-4" />}
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h3 className="font-bold text-gray-700 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-800">Hospital:</span> {hospital.name}</p>
                  <p><span className="font-medium text-gray-800">Doctor:</span> {formData.doctor_id || 'Not selected'} ({formData.department})</p>
                  <p><span className="font-medium text-gray-800">Time:</span> {formData.date} at {formData.slot_time}</p>
                  <p><span className="font-medium text-gray-800">Payment:</span> {formData.paymentMode}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 flex justify-between pt-4 border-t">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                Back
              </button>
            ) : <div></div>}
            
            <button type="submit" disabled={loading} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              {loading ? 'Processing...' : step === 3 ? 'Confirm Booking' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
