import {BrowserRouter, Routes, Route} from "react-router-dom";
import { VerProductos } from "./pages/VerProductos";
import { AgregarProductoInsumos } from "./pages/AgregarProductoInsumos";
import {Inventory} from "./features/inventario/main";

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/productos" element={<VerProductos />} />
        <Route path="/productos/agregar" element={<AgregarProductoInsumos />} />
        <Route path="/inventario" element={<Inventory />} />
      </Routes>
    
    </BrowserRouter>
  );
}


export default App;
