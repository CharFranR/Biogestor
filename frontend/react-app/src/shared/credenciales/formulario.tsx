// FormBase.jsx
import { useState } from 'react';
import styled from 'styled-components';
import { Encabezado, Titulo, Logo } from '../../shared/barraLateral/barraLateral';
import { Boton, ContenidoBoton } from '../../shared/Boton/boton';
import logo from '../../assets/logo.png';

// Interfaces TypeScript
interface CampoFormulario {
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

export interface BotonFormulario {
  label: string;
  color: string;
  tipo: string;
  accion: 'submit' | 'navegacion'; // Nueva prop para diferenciar acciones
}

interface FormBaseProps {
  titulo?: string;
  campos?: CampoFormulario[];
  botones?: BotonFormulario[];
  onSubmit?: (formData: Record<string, string>) => void;
  onNavegacion?: (tipo: string) => void;
}

interface Errors {
  [key: string]: string;
}

// Styled Components (igual que antes)
const PageContainer = styled.div`
  min-height: 100vh;
  background: #DEFCE8;
  background: linear-gradient(0deg,rgba(222, 252, 232, 1) 3%, rgba(242, 245, 240, 1) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FormContainer = styled.div`
  width: 400px;
  background-color: #fafafa;
  border-radius: 15px;
  overflow: hidden;
  padding: 30px;
`;

const EncabezadoForm = styled(Encabezado)`
  justify-content: center;
`;

const BotonForm = styled(Boton)`
  && {
    &:hover:not(:disabled) {
      transform: none !important;
    }
  }
`;

const ContenedorBotones = styled(ContenidoBoton)`
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
`;

const InputBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;

  input {
    width: 100%;
    max-width: 500px;
    padding: 10px 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    
    &:focus {
      outline: none;
      border-color: #01663d;
    }
  }
`;

const ErrorText = styled.span`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

// Hook personalizado
const useForm = (initialState: Record<string, string>) => {
  const [formData, setFormData] = useState<Record<string, string>>(initialState);
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (campos: CampoFormulario[]): boolean => {
    const newErrors: Errors = {};
    let isValid = true;

    campos.forEach(campo => {
      if (campo.required && !formData[campo.name]?.trim()) {
        newErrors[campo.name] = 'Este campo es requerido';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  return {
    formData,
    errors,
    handleChange,
    validateForm,
    setFormData
  };
};

export const FormBase: React.FC<FormBaseProps> = ({ 
  titulo = "Biogestor",
  campos = [],
  botones = [],
  onSubmit,
  onNavegacion
}) => {
  const initialState: Record<string, string> = campos.reduce((acc, campo) => {
    acc[campo.name] = '';
    return acc;
  }, {} as Record<string, string>);

  const { formData, errors, handleChange, validateForm } = useForm(initialState);

  const manejarAccion = (boton: BotonFormulario) => {
    if (boton.accion === 'submit') {
      // Solo validar campos requeridos para submit
      const camposRequeridos = campos.filter(campo => campo.required);
      const isValid = validateForm(camposRequeridos);

      if (isValid && onSubmit) {
        onSubmit(formData);
      }
    } else if (boton.accion === 'navegacion' && onNavegacion) {
      // Navegación sin validación
      onNavegacion(boton.tipo);
    }
  };

  return (
    <PageContainer>
      <FormContainer>
        <EncabezadoForm>
          <Logo src={logo} alt="Biogestor Logo" />
          <Titulo>{titulo}</Titulo>
        </EncabezadoForm>

        <form onSubmit={(e) => e.preventDefault()}>
          {campos.map((campo) => (
            <InputBox key={campo.name}>
              <input
                type={campo.type}
                name={campo.name}
                placeholder={campo.placeholder}
                value={formData[campo.name]}
                onChange={handleChange}
                required={campo.required}
              />
              {errors[campo.name] && (
                <ErrorText>{errors[campo.name]}</ErrorText>
              )}
            </InputBox>
          ))}

          <ContenedorBotones>
            {botones.map((boton, index) => (
              <BotonForm
                key={index}
                size="medium"
                label={boton.label}
                color={boton.color}
                onClick={() => manejarAccion(boton)}
                sinMovimiento={true}
                centrado={true}
              />
            ))}
          </ContenedorBotones>
        </form>
      </FormContainer>
    </PageContainer>
  );
};