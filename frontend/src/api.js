// Central API base URL config
// In production this reads from the VITE_API_URL environment variable
// In development it falls back to localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE;
