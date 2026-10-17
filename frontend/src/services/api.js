import axios from "axios";

// const API = axios.create({
//   // baseURL: process.env.REACT_APP_API_URL
//   baseURL: process.env.REACT_APP_BACKEND_URL
// });
const API = axios.create({
  baseURL: "https://nestlocker-backend.onrender.com/api",
});

export default API;