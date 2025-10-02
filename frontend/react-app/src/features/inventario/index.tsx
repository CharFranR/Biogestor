// features/inventory/Inventory.tsx
import { useState } from 'react';

import {BarraLateral} from "../../shared/barraLateral/barraLateral"

import {BarraArriba} from "../../shared/barraAriiba/barraArriba"

export function Inventory() {
  const [vistaActual, setVistaActual] = useState('Perfil');
  const [sidebarAbierta, setSidebarAbierta] = useState(true);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Barra lateral con ancho dinámico */}
      <BarraLateral abierta={sidebarAbierta} onBotonClick={setVistaActual} />

      {/* Contenido principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <BarraArriba
          vistaActual={vistaActual}
          onToggleSidebar={() => setSidebarAbierta(!sidebarAbierta)}
        />
        <div style={{ padding: 20 }}>
          {/* Aquí va tu contenido principal */}
          Contenido de la vista: {vistaActual}
        </div>
      </div>
    </div>
  );
}
