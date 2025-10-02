import styled from 'styled-components'
import { Cabecera } from '../cabecera/cabecera';


const BarraContainer = styled.div`
   height: 91px;
    width: 100%;
    background-color: white;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #dee2e6;
`


interface BarraArribaProps {
    vistaActual: string;
    onToggleSidebar?: () => void;
}

export function BarraArriba ({ vistaActual, onToggleSidebar }: BarraArribaProps){
    return(
        <BarraContainer>
             <Cabecera texto={vistaActual} onToggleSidebar={onToggleSidebar} />
        </BarraContainer>      
    );
}
