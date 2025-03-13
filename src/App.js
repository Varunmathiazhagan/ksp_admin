import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminHome from './components/admin_home';
import AddProduct from './components/AddProduct';
import ManageProducts from './components/ManageProducts';
import AdminContacts from './components/contact';
import Login from './components/Login';
import User from './components/user';
import './App.css';
import './styles/contact.css';
import './styles/global.css';
import './styles/login.css'; // Add this import

const MAX_SESSION_TIME = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

const checkAuth = () => {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0');
  const currentTime = new Date().getTime();
  
  if (!isAuthenticated || !loginTime || (currentTime - loginTime > MAX_SESSION_TIME)) {
    sessionStorage.clear();
    return false;
  }
  return true;
};

const logout = (navigate) => {
  sessionStorage.clear();
  navigate('/login', { replace: true });
};

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!checkAuth()) {
      logout(navigate);
    }
  }, [navigate]);

  if (!checkAuth()) {
    return null;
  }
  
  return (
    <div>
      <button 
        onClick={() => logout(navigate)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={
            checkAuth() ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="/" element={
            <PrivateRoute>
              <AdminHome />
            </PrivateRoute>
          } />
          <Route path="/add-product" element={
            <PrivateRoute>
              <AddProduct />
            </PrivateRoute>
          } />
          <Route path="/manage-products" element={
            <PrivateRoute>
              <ManageProducts />
            </PrivateRoute>
          } />
          <Route path="/contacts" element={
            <PrivateRoute>
              <AdminContacts />
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute>
              <User />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
