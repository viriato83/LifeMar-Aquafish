import { useEffect, useState } from "react";
import ClienteRepository from "./ClienteRepository";
import Header from "../../../components/Header";
import Conteinner from "../../../components/Conteinner";
import Slider from "../../../components/Slider";
import Content from "../../../components/Content";
import RegistarClientes from "./Clientes";

import { useNavigate } from "react-router-dom";
import Modal from "../../../components/modal";
import modal from "../../../components/modal";
import mensagem from "../../../components/mensagem";
import Footer from "../../../components/Footer";
import Loading from "../../../components/loading";

import * as XLSX from 'xlsx'; // Importar o XLSX

export default function ClientesView() {
  const repositorio = new ClienteRepository();
  
  const [loading, setLoading] = useState(false);
  const [modelo, setModelo] = useState([]);
  const [total, setTotal] = useState(0);
  const [id, setId] = useState("");
  const navigate = useNavigate();
  let moda = new modal();
  let msg = new mensagem();
   const permissao = sessionStorage.getItem("cargo")
  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const dadosModelo = await repositorio.leitura();
        const dadosTotal = await repositorio.total();
        setModelo(dadosModelo);
        setTotal(dadosTotal);
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();

  }, []);

  // Função para exportar os dados para Excel
  const exportarParaExcel = () => {
    const ws = XLSX.utils.json_to_sheet(modelo); // Convertendo os dados para planilha
    const wb = XLSX.utils.book_new(); // Criando o livro de trabalho
    XLSX.utils.book_append_sheet(wb, ws, "Clientes"); // Adicionando a planilha ao livro
    XLSX.writeFile(wb, "clientes.xlsx"); // Gerando o arquivo
  };

  return (
    <>
      {loading && <Loading></Loading>}
      <Header />
      <Conteinner>
        <Slider />
        <Content>
        <h2 >Clientes </h2>
          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Localização</th>
                  <th>Telefone</th>
                  <th>Estado de Pagamento</th>
                
                </tr>
              </thead>
              <tbody>
              {modelo.map((elemento, i) => {
                  let estado=""
                  if(elemento.status_p=="Pago"){
                    estado="bg-success p-2"
                  }
                  if(elemento.status_p=="Em_Divida"){
                    estado="bg-danger p-2"
                  }
                  if(elemento.status_p=="Pendente"){
                    estado="bg-warning p-2"
                  }

                  return(
                  <tr key={i} className="tr ">
                    <td>{elemento.idclientes}</td>
                    <td>{elemento.nome}</td>
                    <td>{elemento.localizacao}</td>
                    <td>{elemento.telefone}</td>
                    <td><span className={estado}>{elemento.status_p}</span></td>
              
                  </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4">Total</td>
                  <td>{total}</td>
                </tr>
              </tfoot>
            </table>
            <div className="crud">
              <button
                className="editar"
                onClick={() => {
                  if (id) {
                    moda.Abrir("Deseja editar o " + id);
                    document.querySelector(".sim").addEventListener("click", () => {
                      navigate(`/registar-clientes/${id}`);
                    });
                    document.querySelector(".nao").addEventListener("click", () => {
                      moda.fechar();
                    });
                  } else {
                    msg.Erro("Por favor, digite um ID válido!");
                  }
                }}
              >
                Editar
              </button>
              <input
                type="number"
                className="crudid"
                placeholder="Digite o ID"
                value={id}
                onChange={(e) => setId(e.target.value)} 
              />
              <button
                onClick={() => {
                  if (id) {
                    moda.Abrir("Deseja apagar o " + id);
                    document.querySelector(".sim").addEventListener("click", () => {
                      repositorio.deletar(id);
                      moda.fechar();
                    });
                    document.querySelector(".nao").addEventListener("click", () => {
                      moda.fechar();
                    });
                  } else {
                    msg.Erro("Por favor, digite um ID válido!");
                  }
                }}
                className="apagar"
              >
                Apagar
              </button>

            </div>
           
              {permissao==="admin" &&(  <button onClick={exportarParaExcel} className="btn-export">
                Exportar para Excel
              </button>)}
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
