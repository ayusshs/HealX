import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HospitalSearch from './pages/HospitalSearch';
import HospitalList from './pages/HospitalList';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import SuperAdmin from './pages/SuperAdmin';
import Profile from './pages/Profile';
import BookAppointment from './pages/BookAppointment';
import Receipt from './pages/Receipt';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/hospitals" element={<HospitalSearch />} />
            <Route path="/hospitals/results" element={<HospitalList />} />
            
            {/* Protected Patient Routes */}
            <Route path="/chat" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/book/:hospitalId" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <BookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/receipt/:appointmentId" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Receipt />
              </ProtectedRoute>
            } />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <Admin />
              </ProtectedRoute>
            } />
            
            <Route path="/superadmin" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdmin />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
