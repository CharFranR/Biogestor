import styled from 'styled-components'

const CardContainer= styled.div`
    width: 350px;
    height: 400px;
    background-color: #cafc55;
    padding: 10px;
    border-radius: 8px;
`;

const Cardbody= styled.div`
    width: 18rem;
    padding: 10px;
    backgroundColor: #cafc55ff;
`;


interface Props {
    body: string;
}

function Card (props: Props){
    const {body} = props;

    return(
        
        <CardContainer>
            <Cardbody>{body}</Cardbody>
        </CardContainer>
        );

}

export default Card;


// function Card (){
    

//     return(
//         <div
//             className="card"
//             style={{
//                 width: "350px",
//                 height: "400px",
//                 backgroundColor: "#cafc55ff",
//                 padding: "10px"
//             }}
//         >
//             <div className="card-body" style={{width: "18rem", backgroundColor: "#cafc55ff"}}><Cardbody /></div>
            
//         </div>

//         );

// }

// export default Card;

// export function Cardbody (){
    
//     return (<h1>Soy un Cardbody</h1>);
// }




// function Card (props: Props){
//     const {body} = props;

//     return(
//         <div
//             className="card"
//             style={{
//                 width: "350px",
//                 height: "400px",
//                 backgroundColor: "#cafc55ff",
//                 padding: "10px"
//             }}
//         >
//             <div className="card-body" style={{width: "18rem", backgroundColor: "#cafc55ff"}}>{body}</div>
            
//         </div>

//         );

// }














export const Card2: React.FC = () => {


    return (0)
}


