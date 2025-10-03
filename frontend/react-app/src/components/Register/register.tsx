// Register.jsx
import { FormBase, BotonFormulario } from '../../shared/credenciales/formulario';
import { useNavigate } from 'react-router-dom';

export const Register = () => {
  const navigate = useNavigate();

  const camposRegistro = [
    { name: 'nombre', type: 'text', placeholder: 'Nombre completo', required: true },
    { name: 'email', type: 'email', placeholder: 'Correo electrónico', required: true },
    { name: 'usuario', type: 'text', placeholder: 'Nombre de usuario', required: true },
    { name: 'password', type: 'password', placeholder: 'Contraseña', required: true },
    { name: 'confirmarPassword', type: 'password', placeholder: 'Confirmar contraseña', required: true },
    { name: 'telefono', type: 'tel', placeholder: 'Teléfono (opcional)', required: false } // Campo extra no requerido
  ];

  const botonesRegistro: BotonFormulario[] = [
    { 
      label: "Registrarse", 
      color: "#36a93f",
      tipo: "registro",
      accion: "submit"
    },
    { 
      label: "Iniciar Sesión", 
      color: "#fafafa", 
      tipo: "login",
      accion: "navegacion"
    }
  ];

  const handleSubmit = (formData: Record<string, string>) => {
    console.log('Registro con:', formData);
    // Lógica de registro
  };

  const handleNavegacion = (tipo: string) => {
    if (tipo === 'login') {
      navigate('/login');
    }
  };

  return (
    <FormBase
      titulo="Crear Cuenta"
      campos={camposRegistro}
      botones={botonesRegistro}
      onSubmit={handleSubmit}
      onNavegacion={handleNavegacion}
    />
  );
};