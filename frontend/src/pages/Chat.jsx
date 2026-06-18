import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Activity, User, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import API_BASE from '../api';

export default function Chat() {
  const [messages, setMessages] = useState([{
      role: 'assistant',
      content: 'Hello! I am HealX AI. How can I assist you with your health today?'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    // Get auth token and patient details
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let patient_context = {};
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        patient_context = { patient_id: user.patient_id };
      } catch (err) {
        console.error("Failed to parse user details:", err);
      }
    }

    try {
      const res = await axios.post(`${API_BASE}/api/ai/chat`, { 
        message: userMessage,
        patient_context: patient_context
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const responseText = res.data.response;
      const responseIntent = res.data.intent;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText, intent: responseIntent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the medical AI servers right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[80vh] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-teal-600 p-4 text-white flex items-center gap-3">
         <div className="bg-white/20 p-2 rounded-full">
            <Activity className="h-6 w-6" />
         </div>
         <div>
            <h2 className="font-bold">HealX Medical AI</h2>
            <p className="text-xs text-teal-100">HealX Local AI Engine (gemma3:4b)</p>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
         {messages.map((msg, idx) => {
            const isEmergency = msg.content.includes('Call 108 immediately');
            
            return (
             <div key={idx} className={clsx("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                <div className={clsx("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", 
                                     msg.role === 'user' ? "bg-teal-100 text-teal-600" : "bg-teal-600 text-white")}>
                   {msg.role === 'user' ? <User size={16} /> : <Activity size={16} />}
                </div>
                <div className={clsx("p-4 rounded-2xl text-sm", 
                                     msg.role === 'user' ? "bg-teal-600 text-white rounded-tr-sm" : 
                                     isEmergency ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-sm shadow-sm" : 
                                     "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm")}>
                   {isEmergency && <div className="flex items-center gap-1 font-bold text-red-600 mb-2 border-b border-red-200 pb-2"><AlertTriangle size={16} /> EMERGENCY ALERT</div>}
                   {msg.intent && (
                     <div className="text-[10px] text-teal-650 bg-teal-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mb-1.5 inline-block border border-teal-200">
                       Intent: {msg.intent.replace('_', ' ')}
                     </div>
                   )}
                   <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
             </div>
            );
         })}
         {loading && (
             <div className="flex gap-4 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center">
                   <Activity size={16} className="animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-100 text-gray-500 rounded-tl-sm shadow-sm flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '0ms'}}></span>
                   <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '150ms'}}></span>
                   <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Chips */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 flex flex-wrap gap-2">
        {[
          { label: "Book Cardiology at SUM Hospital", text: "I want to book an appointment for Cardiology at SUM Hospital" },
          { label: "Check Wait Time", text: "How long is the queue wait for ENT at SUM Hospital?" },
          { label: "Report Analysis Help", text: "Can you analyze a clinical report for me?" },
          { label: "Check my Medical Wallet", text: "Show me my medical wallet summary" }
        ].map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInput(chip.text)}
            className="text-xs bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 px-3 py-1.5 rounded-full font-medium transition-colors shadow-sm"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
         <form onSubmit={handleSend} className="relative flex items-center">
            <input 
               type="text" 
               placeholder="Describe your symptoms or ask a medical question..." 
               className="w-full pl-6 pr-14 py-4 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
               value={input}
               onChange={e => setInput(e.target.value)}
               disabled={loading}
            />
            <button 
               type="submit" 
               disabled={loading || !input.trim()}
               className="absolute right-2 p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 transition-colors">
               <Send size={18} />
            </button>
         </form>
         <p className="text-center text-xs text-gray-400 mt-3">
            AI can make mistakes. Always consult a real doctor for serious conditions.
         </p>
      </div>
    </div>
  );
}
