// Login.jsx
import { FormBase, BotonFormulario  } from '../../shared/credenciales/formulario';
import { useNavigate } from 'react-router-dom'; // Si usas React Router

export const Login = () => {
  const navigate = useNavigate();

  const camposLogin = [
    { name: 'usuario', type: 'text', placeholder: 'Nombre de usuario', required: true },
    { name: 'password', type: 'password', placeholder: 'Contraseña', required: true }
  ];

  const botonesLogin: BotonFormulario[] =[
    { 
      label: "Iniciar Sesión", 
      color: "#36a93f",
      tipo: "login",
      accion: "submit" // Valida campos
    },
    { 
      label: "Registrarse", 
      color: "#fafafa", 
      tipo: "registro",
      accion: "navegacion" // No valida, solo navega
    }
  ];

  const handleSubmit = (formData: Record<string, string>) => {
    console.log('Login con:', formData);
    // Lógica de login (API call, etc.)
  };

  const handleNavegacion = (tipo: string) => {
    if (tipo === 'registro') {
      navigate('/registro'); // O la ruta que uses
      // O si no usas router: window.location.href = '/registro'
    }
  };

  return (
    <FormBase
      titulo="Iniciar Sesión"
      campos={camposLogin}
      botones={botonesLogin}
      onSubmit={handleSubmit}
      onNavegacion={handleNavegacion}
    />
  );
};