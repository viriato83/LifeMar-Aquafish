import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import Conteinner from "../../../components/Conteinner";
import Slider from "../../../components/Slider";
import Content from "../../../components/Content";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/modal";
import mensagem from "../../../components/mensagem";
import Footer from "../../../components/Footer";
import repositorioStock from "./Repositorio";
import Loading from "../../../components/loading";
import * as XLSX from "xlsx"; // Importing the xlsx library

export default function StockView() {
  const repositorio = new repositorioStock();
  const [modelo, setModelo] = useState([]);
  const [total, setTotal] = useState(0);
  const [id, setId] = useState(""); // State for the entered ID
  const navigate = useNavigate();
   const permissao= sessionStorage.getItem("cargo")
  const [loading, setLoading] = useState(false); // Loading state
  let moda = new Modal();
  let msg = new mensagem();

  useEffect(() => {
    async function carregarDados() {
      setLoading(true); // Activate loading
      try {
        const dadosModelo = await repositorio.leitura();
        const dadosTotal = await repositorio.total();
        setModelo(dadosModelo);
        setTotal(dadosTotal);
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      } finally {
        setLoading(false); // Deactivate loading
      }
    }
    carregarDados();
  }, []);

  // Function to export data to Excel
  const exportToExcel = () => {
    // Create a worksheet from the data
    const ws = XLSX.utils.json_to_sheet(
      modelo.map((item) => ({
        ID: item.idstock,
        Quantidade: item.quantidade,
        Tipo: item.tipo,
        Mercadorias: item.mercadorias.map((merc) => `${merc.idmercadoria} : ${merc.nome}`).join(", "),
        Total: item.total, // Assuming `item.total` exists in your data
      }))
    );
    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    
    // Export the workbook to an Excel file
    XLSX.writeFile(wb, "StockData.xlsx");
  };

  return (
    <>
      {loading && <Loading />}
      <Header />
      <Conteinner>
        <Slider />
        <Content>
        <h2 >Stock </h2>
          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Quantidade</th>
                  <th>Tipo</th>
                  {/* <th>Mercadoria</th> */}
                 
                </tr>
              </thead>
              <tbody>
                {modelo.map((elemento, i) => (
                  <tr key={i}>
                    <td>{elemento.idstock}</td>
                    <td>{elemento.quantidade} </td>
                    <td>{elemento.tipo}</td>
                   
                   
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">Total</td>
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
                      navigate(`/registar-stock/${id}`);
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
                onChange={(e) => setId(e.target.value)} // Update the state with the entered value
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
            {permissao==="admin" &&( <button onClick={exportToExcel} className="btn-export">
                Exportar para Excel
              </button>)}
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
