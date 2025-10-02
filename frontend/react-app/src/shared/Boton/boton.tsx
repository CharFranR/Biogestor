import { PropiedadesBoton } from "./boton.tipos"
import styled from 'styled-components'

const BotonStyled = styled.button<{
  $size: string;
  $color: string;
  $disabled: boolean;
}>`
  border: none;
  margin: 0;
  padding: ${props => 
    props.$size === 'small' ? '5px 10px' : 
    props.$size === 'large' ? '15px 30px' : '10px 20px'
  };
  
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  border-radius: 4px;
  color: #000000ff;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-size: 15px;
  transition: all 0.3s ease;
  text-align: left;
  justify-content: flex-start;
  background-color: ${props => props.$color};
  opacity: ${props => props.$disabled ? 0.6 : 1};
  box-sizing: border-box; /* 

   /* Efecto hover solo cuando no está deshabilitado */
  &:hover:not(:disabled) {
    color: #01663d; 
    background-color: #dee2e6; 
    transform: translateX(5px);
  }

  /* Estilo para cuando está deshabilitado */
  &:disabled {
    cursor: not-allowed;
  }
`

const ContenidoBoton = styled.div`
  display: flex;
  align-items: center; 
  gap: 12px; 
  width: 100%;
  text-align: left;
  align-items: flex-start;
  box-sizing: border-box; 
`

const LogoContenedor = styled.div`
  display: flex;
  flex-direction: column;
`

const TextoContenedor = styled.div`
  display: flex;
  flex-direction: column;
`

const Etiqueta = styled.div`
  font-weight: bold;
  line-height: 1.2;
  text-align: left;
  width: 100%;
`

const SubEtiqueta = styled.div`
  font-size: 0.8em;
  opacity: 0.9;
  line-height: 1.1;
  font-weight: normal;
  text-align: left;
  width: 100%;
`

export const Boton: React.FC<PropiedadesBoton> = ({
    size = "small",
    disabled = false,
    color = "blue",
    icon,
    label,
    content,
    onClick,
}) => {

  const manejarClick = () => {
        if (onClick && !disabled) {
            onClick(label); // Pasar el label aquí
        }
    }


    return(
        <BotonStyled 
            $size={size}
            $color={color}
            $disabled={disabled}
            disabled={disabled}
            onClick={manejarClick}
        >
            <ContenidoBoton>
                <LogoContenedor>{icon}</LogoContenedor>
                <TextoContenedor>  
                    <Etiqueta>{label}</Etiqueta>
                    {content && <SubEtiqueta>{content}</SubEtiqueta>}
                </TextoContenedor> 
            </ContenidoBoton>
        </BotonStyled>
    )   
}