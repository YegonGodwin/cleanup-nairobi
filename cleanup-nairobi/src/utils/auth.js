import { jwtDecode } from 'jwt-decode';

// Function to get the token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Function to set the token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Function to remove the token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Function to decode the token and get user data
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Function to check if the token is expired
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};
