import axios from 'axios';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : window.location.origin;

const api = axios.create({ baseURL: BASE_URL });
export default api;
export { BASE_URL };
