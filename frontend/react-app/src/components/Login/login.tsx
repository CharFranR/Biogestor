// Login.tsx - Versión refactorizada
import { useState } from 'react';
import { FormBase } from '../../shared/credenciales/formulario';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { FormField, FormButton } from '../../types';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const camposLogin: FormField[] = [
    { name: 'username', type: 'text', placeholder: 'Nombre de usuario', required: true },
    { name: 'password', type: 'password', placeholder: 'Contraseña', required: true }
  ];

  const botonesLogin: FormButton[] = [
    { 
      label: loading ? "Iniciando sesión..." : "Iniciar Sesión", 
      color: "#01663d",
      tipo: "login",
      accion: "submit" as const
    },
    { 
      label: "Registrarse", 
      color: "#fafafa", 
      tipo: "registro",
      accion: "navegacion" as const
    }
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    setLoading(true);
    setError('');

    try {
      const credenciales = {
        username: formData.username,
        password: formData.password
      };

      console.log('Enviando credenciales:', credenciales);
      
      // Usar el nuevo servicio refactorizado
      const respuesta = await authService.login(credenciales);
      
      console.log('Respuesta del servidor:', respuesta);
      
  // Redirigir a una ruta existente protegida
  navigate('/sensores');

    } catch (error: any) {
      console.error('Error en login:', error);
      
      const mensajeError = error.message || 'Error al iniciar sesión';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const handleNavegacion = (tipo: string) => {
    if (tipo === 'registro') {
      navigate('/registro');
    }
  };

  return (
    <>
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
      <FormBase
        titulo="Iniciar Sesión"
        campos={camposLogin}
        botones={botonesLogin}
        onSubmit={handleSubmit}
        onNavegacion={handleNavegacion}
      />
    </>
  );
};