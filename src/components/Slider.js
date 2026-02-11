import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { MdDashboard, MdPeople, MdInventory, MdLocalMall, MdAttachMoney } from "react-icons/md";

export default function Slider() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const buscarCargo = () => sessionStorage.getItem("cargo");

  return (
    <>
      {/* Botão Hamburger */}
      <button
        className={`hamburger-menu ${sidebarOpen ? "open" : ""}`}
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? "active" : ""}`}>
        <ul>
          {/* === Seção Dashboard === */}
          <li className="section-title">
            <MdDashboard /> Dashboard
          </li>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
            >
              Painel Principal
            </NavLink>
          </li>

          {/* === Seção Clientes === */}
          <li className="section-title">
            <MdPeople /> Clientes
          </li>
          <li>
            <NavLink
              to="/registarclientes"
              className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""} `}
            >
              Registar Cliente
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/clientesview"
              className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
            >
              Lista de Clientes
            </NavLink>
          </li>

          {/* === Seção Stock e Mercadorias (somente se não for vendedor) === */}
          {buscarCargo() !== "vendedor" && (
            <>
              {/* Stock */}
              <li className="section-title">
                <MdInventory /> Stock
              </li>
              <li>
                <NavLink
                  to="/RegistarStock"
                  className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
                >
                  Registar Stock
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/stockview"
                  className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
                >
                  Relatório Stock
                </NavLink>
              </li>

              {/* Mercadorias */}
              <li className="section-title">
                <MdLocalMall /> Mercadorias
              </li>
              <li>
                <NavLink
                  to="/registarmercadoria"
                  className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
                >
                  Registar Mercadoria
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/mercadoriaview"
                  className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
                >
                  Relatório Mercadorias
                </NavLink>
              </li>
            </>
          )}

          {/* === Seção Vendas === */}
          <li className="section-title">
            <MdAttachMoney /> Vendas
          </li>
          <li>
            <NavLink
              to="/registarvenda"
              className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
            >
              Registar Venda
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/vendasview"
              className={({ isActive }) => `toggle-menu ${isActive ? "active1" : ""}`}
            >
              Relatório Vendas
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* ===== Estilos simples para títulos de seção ===== */}
      <style jsx>{`
        .section-title {
          font-weight: bold;
          font-size: 0.9rem;
          padding: 10px 20px;
          margin-top: 15px;
          color: #999;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-menu {
          display: block;
          padding: 10px 20px;
          color: #fff;
          text-decoration: none;
          transition: background 0.3s;
        }

        .toggle-menu.active1 {
          background-color: #007bff; /* cor de destaque */
        }

        .toggle-menu:hover {
          background-color: #0056b3;
        }
      `}</style>
    </>
  );
}
