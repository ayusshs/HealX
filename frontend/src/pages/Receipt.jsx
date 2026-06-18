import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Printer, Download, Share2, ArrowLeft } from 'lucide-react';
import API_BASE from '../api';

export default function Receipt() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [user, setUser] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    const fetchAppointment = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/patient/appointment/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointment(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointment();
  }, [appointmentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;
    
    // Temporarily apply print styles for better PDF output if needed
    element.classList.add('p-8');
    
    const canvas = await html2canvas(element, { scale: 2 });
    const data = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Healx_Receipt_${appointmentId}.pdf`);
    
    element.classList.remove('p-8');
  };

  if (!appointment) return <div className="p-8 text-center">Loading receipt...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Non-printable Action Bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <Link to="/" className="text-teal-600 hover:text-teal-800 flex items-center gap-2 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Printable Receipt Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mx-auto print:shadow-none print:border-none" style={{ maxWidth: '800px' }}>
        <div ref={receiptRef} className="bg-white">
          {/* Receipt Header */}
          <div className="bg-teal-700 text-white p-8 flex justify-between items-center print:bg-teal-700 print:text-white">
            <div>
              <h1 className="text-3xl font-bold tracking-wider">HEALX</h1>
              <p className="opacity-90 mt-1">Official Booking Receipt</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">{appointment.hospital?.name || 'Healx Network Hospital'}</h2>
              <p className="text-sm opacity-90 max-w-xs">{appointment.hospital?.address || 'Hospital Address'}</p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8 border-b pb-8 border-gray-200 border-dashed">
              <div className="flex-1">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Appointment Code</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{appointment.booking_id}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    <span className="text-gray-500">Date:</span> <span className="font-bold">{new Date(appointment.booked_at).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    <span className="text-gray-500">Status:</span> <span className="font-bold text-teal-600 uppercase">{appointment.status}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-2 border rounded-xl shadow-sm">
                <QRCodeSVG value={appointment.booking_id} size={100} level="M" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Patient Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Patient Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500 text-sm">Name:</span>
                    <span className="col-span-2 font-medium text-gray-900">{user.name}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500 text-sm">Email:</span>
                    <span className="col-span-2 font-medium text-gray-900">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Consultation Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500 text-sm">Department:</span>
                    <span className="col-span-2 font-medium text-gray-900">{appointment.department}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500 text-sm">Doctor:</span>
                    <span className="col-span-2 font-medium text-gray-900">{appointment.doctor_id || 'Any Available'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500 text-sm">Time Slot:</span>
                    <span className="col-span-2 font-medium text-gray-900">{appointment.slot_time}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500 text-sm">Type:</span>
                    <span className="col-span-2 font-medium text-gray-900">{appointment.type}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Payment Mode</p>
                  <p className="font-bold text-gray-800">{appointment.paymentMode}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm mb-1">Payment Status</p>
                  <p className="font-bold text-yellow-600 uppercase tracking-wide">{appointment.paymentStatus}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-sm text-gray-500 border-t pt-6 border-gray-200">
              <p>This is a computer-generated receipt.</p>
              <p className="mt-1">Please arrive 15 minutes before your scheduled time. Cancellations must be made at least 24 hours in advance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles block */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white; }
          .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
        }
      `}} />
    </div>
  );
}
