import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Users, ArrowRight, Map as MapIcon, List } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import API_BASE from '../api';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function HospitalList() {
  const [searchParams] = useSearchParams();
  const disease = searchParams.get('disease') || '';
  const query = searchParams.get('query') || '';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        // Construct the search query
        let url = `${API_BASE}/api/hospital/search?disease=${encodeURIComponent(disease)}&query=${encodeURIComponent(query)}`;
        const res = await axios.get(url);
        
        // Simple client-side sorting by distance if coords exist
        let fetchedHospitals = res.data;
        if (lat && lng) {
          fetchedHospitals.forEach(h => {
            if (h.location?.lat && h.location?.lng) {
              h.distance = calculateDistance(lat, lng, h.location.lat, h.location.lng);
            }
          });
          fetchedHospitals.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
        }
        
        setHospitals(fetchedHospitals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [disease, query, lat, lng]);

  const handleBook = (hospitalId) => {
    navigate(`/book/${hospitalId}`);
  };

  // Haversine formula for distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => deg * (Math.PI/180);

  if (loading) return <div className="text-center p-10 font-bold text-teal-600">Loading Hospitals...</div>;

  const defaultCenter = lat && lng ? [parseFloat(lat), parseFloat(lng)] : (hospitals[0]?.location ? [hospitals[0].location.lat, hospitals[0].location.lng] : [20.296, 85.824]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Available Hospitals</h1>
          <p className="text-gray-500">Showing results for: <span className="font-semibold text-teal-600">{disease || query || 'All'}</span></p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('list')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button 
            onClick={() => setViewMode('map')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'map' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <MapIcon className="w-4 h-4" /> Map
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {hospitals.map(hospital => (
            <div key={hospital.hospital_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/4 h-48 md:h-auto bg-gray-200 relative">
                <img
                  src={hospital.logo || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop"}
                  alt={hospital.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" /> {hospital.rating}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-800">{hospital.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      hospital.crowd_level === 'High' || hospital.crowd_level === 'Very High'
                        ? 'bg-red-50 text-red-600'
                        : hospital.crowd_level === 'Medium'
                        ? 'bg-yellow-50 text-yellow-600'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      <Users className="w-3 h-3" /> Crowd: {hospital.crowd_level}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1 mb-2">
                    <MapPin className="w-4 h-4" /> {hospital.address || `${hospital.location?.city}, ${hospital.location?.state}`}
                    {hospital.distance && <span className="ml-2 font-semibold text-teal-600">({hospital.distance.toFixed(1)} km away)</span>}
                  </p>
                  
                  <div className="flex gap-2 flex-wrap mb-4">
                    {hospital.specialties?.map(spec => (
                      <span key={spec} className={`text-xs px-2 py-1 rounded-md border ${
                        spec.toLowerCase() === disease.toLowerCase()
                          ? 'bg-teal-50 border-teal-200 text-teal-700 font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>{spec}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <p className="text-gray-500">Working Hours</p>
                    <p className="font-bold text-gray-800">{hospital.workingHours || '24/7'}</p>
                  </div>
                  <button
                    onClick={() => handleBook(hospital.hospital_id)}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    Book Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {hospitals.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl text-gray-500">No hospitals found matching your criteria.</div>
          )}
        </div>
      ) : (
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 h-[600px] overflow-hidden">
          <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {lat && lng && (
              <Marker position={[parseFloat(lat), parseFloat(lng)]}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
            {hospitals.map(h => h.location?.lat ? (
              <Marker key={h.hospital_id} position={[h.location.lat, h.location.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong className="block mb-1">{h.name}</strong>
                    <button onClick={() => handleBook(h.hospital_id)} className="bg-teal-600 text-white text-xs px-3 py-1 rounded w-full mt-2">Book Now</button>
                  </div>
                </Popup>
              </Marker>
            ) : null)}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
