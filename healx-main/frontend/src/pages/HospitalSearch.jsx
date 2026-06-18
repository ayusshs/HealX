import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Stethoscope, HeartPulse, Brain, Eye, MapPin } from 'lucide-react';

const specialties = [
  { name: 'Cardiology', icon: <HeartPulse className="h-8 w-8" />, color: 'bg-red-50 text-red-600' },
  { name: 'ENT', icon: <Stethoscope className="h-8 w-8" />, color: 'bg-blue-50 text-blue-600' },
  { name: 'Dentist', icon: <Stethoscope className="h-8 w-8" />, color: 'bg-teal-50 text-teal-600' },
  { name: 'Neurology', icon: <Brain className="h-8 w-8" />, color: 'bg-purple-50 text-purple-600' },
  { name: 'General', icon: <Search className="h-8 w-8" />, color: 'bg-orange-50 text-orange-600' }
];

export default function HospitalSearch() {
  const navigate = useNavigate();
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Fetching location...');
  const [disease, setDisease] = useState('');
  const [stateLoc, setStateLoc] = useState('Odisha');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationStatus('Location detected');
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationStatus('Location access denied. Please enter city/pincode manually.');
        }
      );
    } else {
      setLocationStatus('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleSearch = (e, explicitDisease = null) => {
    e?.preventDefault();
    const query = explicitDisease || disease;
    let url = `/hospitals/results?disease=${encodeURIComponent(query)}&state=${encodeURIComponent(stateLoc)}`;
    if (locationCoords) {
      url += `&lat=${locationCoords.lat}&lng=${locationCoords.lng}`;
    }
    navigate(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100">
         <h1 className="text-3xl font-bold text-gray-800 mb-4">Find the Right Doctor</h1>
         <p className="text-gray-500 mb-8 max-w-lg mx-auto">Tell us your symptoms or select a specialty, and our AI will find the best hospitals and doctors for you.</p>
         
         <form onSubmit={handleSearch} className="flex flex-col gap-4 max-w-2xl mx-auto">
            <div className="flex gap-4">
              <select className="px-4 py-3 rounded-xl border border-gray-300 outline-none w-1/3 bg-gray-50"
                 value={stateLoc} onChange={e => setStateLoc(e.target.value)}>
                  <option value="Odisha">Odisha</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
              </select>
              <input type="text" placeholder="e.g. Chest pain, Fever, Dentist..." 
                 className="flex-1 px-4 py-3 rounded-xl border border-gray-300 outline-none"
                 value={disease} onChange={e => setDisease(e.target.value)} />
              <button type="submit" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">
                 Search
              </button>
            </div>
            <p className="text-xs text-gray-400 text-left ml-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {locationStatus}
            </p>
         </form>
      </div>

      {/* Specialties */}
      <div>
         <h2 className="text-xl font-bold text-gray-800 mb-4">Popular Specialties</h2>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {specialties.map(spec => (
               <div key={spec.name} 
                    onClick={() => handleSearch(null, spec.name)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 transition-all text-center group">
                  <div className={`${spec.color} w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                     {spec.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800">{spec.name}</h3>
               </div>
            ))}
         </div>
      </div>
      {/* Booking Form Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-8">
         <h2 className="text-xl font-bold text-gray-800 mb-6">Book Appointment</h2>
         <form onSubmit={(e) => handleSearch(e, disease)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={stateLoc} onChange={e => setStateLoc(e.target.value)}>
                     <option>Odisha</option><option>Delhi</option><option>Maharashtra</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disease</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={disease} onChange={e => setDisease(e.target.value)}>
                     <option value="">Select...</option>
                     <option value="Cardiology">Cardiology</option>
                     <option value="ENT">ENT</option>
                     <option value="Neurology">Neurology</option>
                     <option value="Dentist">Dentist</option>
                     <option value="General">General Physician</option>
                  </select>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name + Number</label>
                  <input type="text" placeholder="John Doe - 9876543210" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slot Time</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none">
                     <option>10:00 AM - 11:00 AM</option>
                     <option>11:00 AM - 12:00 PM</option>
                     <option>01:00 PM - 02:00 PM</option>
                     <option>04:00 PM - 05:00 PM</option>
                  </select>
               </div>
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 transition-colors mt-4">
               Find Hospitals & Book
            </button>
         </form>
      </div>
    </div>
  );
}
