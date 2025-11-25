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
   const [totalQuantidade, setTotalQuantidade] = useState(0);
   const [totalEstoque, setTotalEstoque] = useState(0);
  const [loading, setLoading] = useState(false); // Loading state
  let moda = new Modal();
  let msg = new mensagem();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const listaFiltrada = modelo.filter((item) => {
    const passarFiltroTipo =
      pesquisa.trim() === ""
        ? true
        : item.tipo.toLowerCase().includes(pesquisa.toLowerCase());
  
    const dataItem = new Date(item.data);
    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim) : null;
  
    const passarFiltroData =
      (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);
  
    return passarFiltroTipo && passarFiltroData;
  });
  useEffect(() => {
    const listaFiltrada = modelo.filter((item) => {
  const passarFiltroTipo =
    pesquisa.trim() === ""
      ? true
      : item.tipo.toLowerCase().includes(pesquisa.toLowerCase());

  const dataItem = new Date(item.data);
  const inicio = dataInicio ? new Date(dataInicio) : null;
  const fim = dataFim ? new Date(dataFim) : null;

  const passarFiltroData =
    (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);

  return passarFiltroTipo && passarFiltroData;
});
async function carregarDados() {
  setLoading(true);
  try {
    const dadosModelo = await repositorio.leitura();

    // // Cálculo dos totais
    // const somaQuantidade = listaFiltrada.reduce(
    //   (soma, item) => soma + Number(item.quantidade || 0),
    //   0
    // );

    // const somaQuantidadeEstoque = listaFiltrada.reduce(
    //   (soma, item) => soma + Number(item.quantidade_estoque || 0),
    //   0
    // );

    setModelo(dadosModelo);
    // setTotalQuantidade(somaQuantidade);
    // setTotalEstoque(somaQuantidadeEstoque);
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  } finally {
    setLoading(false);
  }
}
carregarDados();
}, []);
useEffect(() => {
// recalcula a lista filtrada sempre que modelo/pesquisa/datas mudarem
const lista = modelo.filter((item) => {
  const passarFiltroTipo =
    pesquisa.trim() === ""
      ? true
      : item.tipo.toLowerCase().includes(pesquisa.toLowerCase());

  const dataItem = new Date(item.data);
  const inicio = dataInicio ? new Date(dataInicio) : null;
  const fim = dataFim ? new Date(dataFim) : null;

  const passarFiltroData =
    (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);

  return passarFiltroTipo && passarFiltroData;
});

// se quiseres continuar a usar listaFiltrada no JSX,
// podes guardar em estado também:
// setListaFiltrada(lista);

const somaQuantidade = lista.reduce(
  (soma, item) => soma + Number(item.quantidade || 0),
  0
);

const somaQuantidadeEstoque = lista.reduce(
  (soma, item) => soma + Number(item.quantidade_estoque || 0),
  0
);

setTotalQuantidade(somaQuantidade);
setTotalEstoque(somaQuantidadeEstoque);
}, [modelo, pesquisa, dataInicio, dataFim]);


  // Function to export data to Excel
  const exportToExcel = () => {
    // Create a worksheet from the data
    const ws = XLSX.utils.json_to_sheet(
      listaFiltrada.map((item) => ({
        ID: item.idstock,
        Quantidade_disp: item.quantidade.toFixed(2),
        Quantidade: item.quantidade_estoque.toFixed(2),
        Tipo: item.tipo,
        Data: item.data,
    
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
        <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
  <input
    type="date"
    value={dataInicio}
    onChange={(e) => setDataInicio(e.target.value)}
    className="data-input"
  />

  <input
    type="date"
    value={dataFim}
    onChange={(e) => setDataFim(e.target.value)}
    className="data-input"
  />

  <button
    onClick={() => {
      setDataInicio("");
      setDataFim("");
      setPesquisa("");
    }}
    className="btn border-black border-2"
  >
    Limpar Filtros
  </button>
</div>
 {/* CAMPO DE PESQUISA */}
 <input
            type="text"
            placeholder="Pesquisar por nome da mercadoria..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pesquisa-input"
          />


          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Quantidade disponivel</th>
                  <th>Quantidade stock</th>
                  <th>Tipo</th>
                  <th>Data</th>
                            {(permissao === "admin" )&&
                             <th>Usuario</th>
                            }
                 
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.length > 0 ? listaFiltrada.map((elemento, i) => (
                  <tr key={i}>
                    <td>{elemento.idstock}</td>
                    <td>{elemento.quantidade} </td>
                    <td>{elemento.quantidade_estoque} </td>
                    <td>{elemento.tipo}</td>
                    <td>{elemento.data}</td>
                   {(permissao === "admin" )&&
                            <td>{elemento.usuario!=null?elemento.usuario.login:0}</td>
                            }
                   
                   
                  </tr>
                )): (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                      Nenhum dado encontrado...
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
              <tr>
                  <td colSpan="1">Total Quantidade Stock</td>
                  <td>{totalEstoque.toFixed(2)}</td>
                  <td colSpan="1">Total Quantidade Dispo</td>
                  <td>{totalQuantidade.toFixed(2)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
            {(permissao == "admin" || permissao == "gerente") && ( 
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
            )

            }
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
