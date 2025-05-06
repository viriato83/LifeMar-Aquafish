import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi"; // Ícones de menu


export default function Slider() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active,setActive] = useState(false)
  const [active1,setActive1] = useState(false)
  const [active2,setActive2] = useState(false)
  const [active3,setActive3] = useState(false)
  const [active4,setActive4] = useState(false)

  const toggleMenu = (menu) => {
    setActiveMenu((prevMenu) => (prevMenu === menu ? null : menu));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const buscarCargo = () => {
    return sessionStorage.getItem("cargo");
  };

  return (
    <>
  
        <button
          className={`hamburger-menu ${sidebarOpen ? "open" : ""}`}
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
   

      <nav className={`sidebar ${sidebarOpen ? "active" : ""}`}>
        <ul>
          <li>
            <Link id="dashboard" to="/" className="toggle-menu">
              Dashboard
            </Link>
          </li>
          <li>
            <Link onClick={() =>{ toggleMenu("clientes-menu"); setActive(!active)}} className=  {` dropdown-toggle toggle-menu bg-${active? "primary":""}`}>
              Clientes
            </Link>
            <ul className={`submenu ${activeMenu === "clientes-menu" ? "show" : ""}`}>
              <li>
                <Link to="/registarclientes">Registar Cliente</Link>
              </li>
              <li>
                <Link to="/clientesview">Ver Clientes Disponíveis</Link>
              </li>
            </ul>
          </li>

          {(buscarCargo() !== "vendedor")? (
            <>
              <li>
                <Link onClick={() =>{ toggleMenu("stock-menu");setActive1(!active1)}} className=  {` dropdown-toggle toggle-menu bg-${active1? "primary":""}`}>
                  Stock
                </Link>
                <ul className={`submenu ${activeMenu === "stock-menu" ? "show" : ""}`}>
                  <li>
                    <Link to="/RegistarStock">Cadastrar Stock</Link>
                  </li>
                  <li>
                    <Link to="/stockview">Ver Stocks Disponíveis</Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link onClick={() =>{toggleMenu("mercadorias-menu"); setActive2(!active2)}} className=  {` dropdown-toggle toggle-menu bg-${active2? "primary":""}`}>
                  Mercadorias
                </Link>
                <ul className={`submenu ${activeMenu === "mercadorias-menu" ? "show" : ""}`}>
                  <li>
                    <Link to="/registarmercadoria">Cadastrar Mercadoria</Link>
                  </li>
                  <li>
                    <Link to="/mercadoriaview">Ver Mercadorias Disponíveis</Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link onClick={() =>{ toggleMenu("mortalidade-menu"); setActive3(!active3)}} className=  {` dropdown-toggle toggle-menu bg-${active3? "primary":""}`}>
                Mortalidade
                </Link>
                <ul className={`submenu ${activeMenu === "mortalidade-menu" ? "show" : ""}`}>
                  <li>
                    <Link to="/Registarmortalidade">Cadastrar Mortalidades</Link>
                  </li>
                  <li>
                    <Link to="/mortalidadeview">Ver Mortalidades Disponíveis</Link>
                  </li>
                </ul>
              </li>
            </>
          ) : null}
   
          <li>
            <Link onClick={() =>{ toggleMenu("vendas-menu"); setActive4(!active4)}} className=  {` dropdown-toggle toggle-menu bg-${active4? "primary":""}`}>
              Vendas
            </Link>
            <ul className={`submenu ${activeMenu === "vendas-menu" ? "show" : ""}`}>
              <li>
                <Link to="/registarvenda">Cadastrar Venda</Link>
              </li>
              <li>
                <Link to="/vendasview">Ver Vendas Disponíveis</Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </>
  );
}
