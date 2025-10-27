// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login/login';
import { Register } from './components/Register/register';
import { PermisosVista } from './components/Permisos/permisos';
import { Dashboard } from './features/dashboard/Dashboard';
import { Sensors } from './features/sensors/Sensors';
import { Reports } from './features/reports/Reports';
import { ProductionCalculator } from './features/calculator/ProductionCalculator';
import './services/interceptor';
import { useEffect, useState } from 'react';
import AlertDialog from './shared/popup/popup';

function App() {
  const [currentView, setCurrentView] = useState('Sensores');

  useEffect(() => {
    // Solo en desarrollo
    if (import.meta.env.DEV) { // ← Vite usa import.meta.env
      const token = localStorage.getItem('authToken');
      const enLogin = window.location.pathname === '/login';
      const rutaActual = window.location.pathname;
      
      if (!token && !enLogin) {
        console.log('🔧 [MODO DESARROLLO] Redirigiendo a login...');
        console.log('📁 Ruta actual:', rutaActual);
        console.log('🔐 Token en localStorage:', token ? 'SÍ existe' : 'NO existe');
        <Navigate to ="/login"/>
      } else if (token) {
        console.log('🔧 [MODO DESARROLLO] Token detectado, sesión activa');
      }
    }
  }, [Navigate]);

  const isAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        
        {/* Rutas protegidas con layout principal */}
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/sensores" 
          element={
            <ProtectedRoute>
              <Sensors />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reportes" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/calculadora" 
          element={
            <ProtectedRoute>
              <ProductionCalculator />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/permisos" 
          element={
            <ProtectedRoute>
              <PermisosVista />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/sensores" />} />
        <Route path="/popup" element={<AlertDialog/>}/>
      </Routes>
    </Router>
  );
}

export default App;