import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161a',
              color:      '#f1f0ee',
              border:     '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '13.5px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#000' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#000' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
