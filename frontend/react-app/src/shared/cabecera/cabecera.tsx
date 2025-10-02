import styled from 'styled-components'
import { LuPanelLeft } from "react-icons/lu";


const CabeceraContainer = styled.div`
    display: flex;
    align-items: center; 
    gap: 12px; 
    width: 100%;
    text-align: left;
    align-items: flex-start;
    box-sizing: border-box; 

`

const CabeceraTexto = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 20px;
`
const IconoTexto = styled.div`
    display: flex;
    flex-direction: column;
    cursor: pointer;
`

interface Props {
    texto: string;
    onToggleSidebar?: () => void;
}

export function Cabecera ({ texto, onToggleSidebar }: Props){

    return (

        <CabeceraContainer >
            <IconoTexto onClick={() => onToggleSidebar?.()}> <LuPanelLeft/> </IconoTexto>
            <CabeceraTexto>{texto}</CabeceraTexto>
        </CabeceraContainer>

    );
}