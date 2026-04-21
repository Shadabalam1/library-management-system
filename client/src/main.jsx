import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import "animate.css";

import 'bootstrap/dist/css/bootstrap.min.css'   // 👈 Bootstrap CSS import
import 'bootstrap/dist/js/bootstrap.bundle.min.js' // 👈 Bootstrap JS import (for modal, dropdown, etc.)
import "bootstrap-icons/font/bootstrap-icons.css";
import './index.css'
import { AuthProvider } from './context/AuthContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);