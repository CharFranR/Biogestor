import { useState } from "react";

export default function DemoButton() {
  const [mensaje, setMensaje] = useState("");

  const handleClick = () => {
    setMensaje("¡Hola! Este es un botón de demostración.");
  };

  return (
    <div>
      <button onClick={handleClick}>Clic aquí</button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}