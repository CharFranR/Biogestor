import {BrowserRouter, Routes, Route} from "react-router-dom";
import { VerProductos } from "./pages/VerProductos";
import { AgregarProductoInsumos } from "./pages/AgregarProductoInsumos";
import {Inventory} from "./features/inventario/";
import { ViewCard } from "./shared/card/";

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/productos" element={<VerProductos />} />
        <Route path="/productos/agregar" element={<AgregarProductoInsumos />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/card" element={<ViewCard />} />
      </Routes>
    
    </BrowserRouter>
  );
}


export default App;
