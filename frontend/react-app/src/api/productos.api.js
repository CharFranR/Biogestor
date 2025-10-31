import axios from "axios";

export const obtenerProductos = () => {
    return axios.get("/productos/");
}