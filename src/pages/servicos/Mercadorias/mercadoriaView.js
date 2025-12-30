import { useEffect, useState, useRef, useMemo } from "react";
import Header from "../../../components/Header";
import Conteinner from "../../../components/Conteinner";
import Slider from "../../../components/Slider";
import Content from "../../../components/Content";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/modal";
import Mensagem from "../../../components/mensagem";
import Footer from "../../../components/Footer";
import RepositorioMercadoria from "./Repositorio";
import Loading from "../../../components/loading";
import * as XLSX from "xlsx"; // Import the xlsx library
import { repositorioVenda } from "../vendas/vendasRepositorio";
import repositorioStock from "../Stock.js/Repositorio";
import { FaSearch } from "react-icons/fa";

export default function MercadoriaView() {
  const repositorio = new RepositorioMercadoria();
  const repositoriovenda = new repositorioVenda();
  const [modelo, setModelo] = useState([]);
  const [total, setTotal] = useState(0);
  const [id, setId] = useState(""); // Estado para o ID digitado
  const navigate = useNavigate();
  const permissao = sessionStorage.getItem("cargo");
  const [loading, setLoading] = useState(false); // Estado para exibir o loading
  const msg = useRef(null); // UseRef para manter uma instância estável
  const moda = useRef(null);
  const [quantidadeTotal, setQuantidadeTotal] = useState(0);
  const [stockSelecionado, setLoteS] = useState(0);
  const [qSaidas, setQSaidas] = useState(0);
  const [modelo2, setModelo2] = useState([]);
  const [quantidadeEst, setQuantidadeEst] = useState(0);
  const repoStco = new repositorioStock();
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [valorDisponivel, setValorDisponivel] = useState(0);
  const [Desp,setDesp]= useState(false)
  // NOVO: filtros de data
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const passaFiltroData = (elemento) => {
    if (!dataInicio && !dataFim) return true; // sem filtro

    if (!elemento.data_entrada) return false;

    const dataElem = new Date(elemento.data_entrada); // assumindo formato ISO (yyyy-mm-dd)

    if (dataInicio) {
      const inicio = new Date(dataInicio);
      if (dataElem < inicio) return false;
    }

    if (dataFim) {
      const fim = new Date(dataFim);
      // Para incluir o dia final até às 23:59
      fim.setHours(23, 59, 59, 999);
      if (dataElem > fim) return false;
    }

    return true;
  };
  useEffect(() => {
    // Inicializa as instâncias uma vez
    msg.current = new Mensagem();
    moda.current = new Modal();
   
    async function carregarDados() {
      setLoading(true);
      try {
        const repoStck = await repoStco.leitura();
        const dadosModelo = await repositorio.leitura();
       

        let valorTotalEntradas = 0;
        let valorTotalDisponivel = 0;
        let quantidadeTotal = 0;
        let quantidadeEst = 0;

        dadosModelo.forEach((e) => {
          if ((!stockSelecionado || stockSelecionado == e.stock.idstock)&&
          passaFiltroData(e) && (( !Desp || e.quantidade>0)) ) {
            quantidadeEst += e.quantidade_est; // disponível
            quantidadeTotal += e.quantidade; // total entrada
            valorTotalEntradas += e.valor_total; // valor total entrada
            valorTotalDisponivel += e.valor_un * e.quantidade; // valor total disponível
          }
        });

        setQuantidadeEst(quantidadeEst);
        setTotal(quantidadeTotal);
        setQuantidadeTotal(valorTotalEntradas); // total entrada
        setValorDisponivel(valorTotalDisponivel); // total disponível
        setModelo(dadosModelo);
        setModelo2(repoStck);
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  },[stockSelecionado, dataInicio, dataFim,Desp]);

 
  // NOVO: mapa de stocks que têm quantidade_est > 0
  const stocksComQuantidade = useMemo(() => {
    const mapa = {};
    modelo.forEach((m) => {
      if (m.stock && m.stock.idstock != null) {
        const id = m.stock.idstock;
        const qtd = Number(m.quantidade_est) || 0;
        if (!mapa[id]) mapa[id] = 0;
        mapa[id] += qtd;
      }
    });
    return mapa; // ex.: { 1: 50, 2: 0, 3: 10 }
  }, [modelo]);

  // Função para exportar os dados para Excel
  const exportToExcel = () => {
    const dados = modelo.filter((elemento) => {
      const nome = elemento.nome?.toLowerCase() || "";
      const tipo = elemento.tipo?.toLowerCase() || "";
      const pesquisa = termoPesquisa.trim();

      return (
        (!stockSelecionado ||
          elemento.stock.idstock == stockSelecionado) &&
        (nome.includes(pesquisa) || tipo.includes(pesquisa)) &&
        passaFiltroData(elemento) && (( !Desp || elemento.quantidade>0)) // NOVO: aplica filtro de data
      );
    }).map((elemento) => ({
      ID: elemento.idmercadoria,
      Nome: elemento.nome,
      Tipo: elemento.tipo,
      Quantidade: elemento.quantidade,
      "Quantidade Disponível": elemento.quantidade_est,
      "Data de Entrada": elemento.data_entrada,
      "Valor Unitário": `${elemento.valor_un} Mt`,
      "Valor Total":
        elemento.valor_total.toLocaleString("pt-PT", {
          minimumFractionDigits: 2,
        }) + " Mt",
      "Data de Saída": elemento.data_saida,
    }));

    // Adiciona linha de resumo ao final
    dados.push(
      {
        ID: "",
        Nome: "",
        Tipo: "",
        Quantidade: "",
        "Quantidade Disponível": "",
        "Data de Entrada": "",
        "Valor Unitário": "",
        "Valor Total": "",
        "Data de Saída": "",
      },
      {
        ID: "Resumo:",
        Nome: "",
        Tipo: "",
        Quantidade: `${total.toFixed(2)} Entradas`,
        "Quantidade Disponível": `${quantidadeEst.toFixed(2)} em Stock`,
        "Data de Entrada": "",
        "Valor Unitário": "",
        "Valor Total":
          `${valorDisponivel.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
          })} Mt (Disponível) / ` +
          `${quantidadeTotal.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
          })} Mt (Entradas)`,
        "Data de Saída": "",
      }
    );

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mercadorias");
    XLSX.writeFile(wb, "mercadorias.xlsx");
  };

  // NOVO: função para validar filtro de data


  return (
    <>
      {loading && <Loading />}
      <Header />
      <Conteinner>
        <Slider />
        <Content>
          <h2>Mercadorias </h2>

          {/* Pesquisa */}
          <label>
            {" "}
            <FaSearch />
            Pesquisar:
          </label>
          <input
            type="search"
            className="pesquisa"
            placeholder="Pesquisar por nome "
            onChange={(e) => setTermoPesquisa(e.target.value.toLowerCase())}
          />

          {/* NOVO: Filtro por Data */}
          <div className="filtros-data d-flex" style={{ marginTop: 10, marginBottom: 10 }}>
            <label style={{ marginRight: 5 }}>Data de entrada (início):</label>
            <input
              type="date"
              className="border border-2 rounded-2"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{ marginRight: 15 }}
            />
            <label style={{ marginRight: 5 }}>Data de entrada (fim):</label>
            <input
             className="border border-2 rounded-2"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          {/* Filtro de Stock */}
          <label>Filtrar por Stock:</label>
          <select
            value={stockSelecionado}
            onChange={(e) => setLoteS(Number(e.target.value))}
          >
            {/* Valor 0 para "todos" */}
            <option value={0}>Todos os Stocks</option>
            {modelo2
              // Só mostra stocks com quantidade_est > 0
              .filter((stock) => (stock.idstock || 0) > 0)
              .map((stock) => (
                <option key={stock.idstock} value={stock.idstock}>
                  Stock {stock.tipo} :: {stock.data}
                </option>
              ))}
          </select>
          <button className={`btn btn-outline-primary border   border-2 ${Desp==true?"bg-primary text-white ":""}` }
          onClick={()=>{setDesp(!Desp)}}
          >
            Filtrar Disponivel
          </button>

          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Quantidade Disponivel </th>
                  <th>Data de Entrada</th>
                  <th>Valor unitário</th>
                  <th>Valor total</th>
                  {/* <th>Q Saidas</th> */}
                  <th>Data de Saída</th>
                  <th>Stock</th>
                  {permissao === "admin" && <th> Usuario</th>}
                </tr>
              </thead>
              <tbody>
                {modelo
                  .filter((elemento) => {
                    const nome = elemento.nome?.toLowerCase() || "";
                    const tipo = elemento.tipo?.toLowerCase() || "";
                    const pesquisa = termoPesquisa.trim();

                    return (
                      (!stockSelecionado ||
                        elemento.stock.idstock == stockSelecionado) &&
                      (nome.includes(pesquisa) || tipo.includes(pesquisa)) &&
                      passaFiltroData(elemento) && (( !Desp || elemento.quantidade>0))// NOVO: aplica filtro de data
                    );
                  })
                  .map((elemento, i) => {
                    return (
                      <tr key={i}>
                        <td>{elemento.idmercadoria}</td>
                        <td>{elemento.nome}</td>
                        <td>{elemento.tipo}</td>
                        {/* Nota: aqui está como já tinhas, se quiseres inverter, avisa */}
                        <td>{elemento.quantidade_est}</td>
                        <td>{elemento.quantidade}</td>
                        <td>{elemento.data_entrada}</td>
                        <td>{elemento.valor_un} Mt</td>
                        <td>
                          {elemento.valor_total.toLocaleString("pt-PT", {
                            minimumFractionDigits: 3,
                          })}{" "}
                          Mt
                        </td>
                        {/* <td>{elemento.q_saidas}</td> */}
                        <td>{elemento.data_saida}</td>
                        <td>
                          {elemento.stock.idstock} : {elemento.stock.tipo};
                        </td>
                        {permissao === "admin" && (
                          <td>
                            {elemento.usuario != null
                              ? elemento.usuario.login
                              : 0}
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4">Totais</td>
                  <td>{quantidadeEst.toFixed(2)} Entradas</td>
                  <td>{total.toFixed(2)}  em Stock</td>
                  <td>
                    {valorDisponivel.toLocaleString("pt-PT", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    Mt (Disponível)
                  </td>
                  <td>
                    {quantidadeTotal.toLocaleString("pt-PT", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    Mt (Entradas)
                  </td>
                </tr>
              </tfoot>
            </table>

            {(permissao === "admin" || permissao === "gerente") && (
              <div className="crud">
                <button
                  className="editar"
                  onClick={() => {
                    if (id) {
                      moda.current.Abrir("Deseja editar o " + id);
                      document
                        .querySelector(".sim")
                        .addEventListener("click", () => {
                          navigate(`/registar-mercadoria/${id}`);
                        });
                      document
                        .querySelector(".nao")
                        .addEventListener("click", () => {
                          moda.current.fechar();
                        });
                    } else {
                      msg.current.Erro("Por favor, digite um ID válido!");
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
                  onChange={(e) => setId(e.target.value)} // Atualiza o estado com o valor digitado
                />
                <button
                  onClick={() => {
                    if (id) {
                      moda.current.Abrir("Deseja apagar o " + id);
                      document
                        .querySelector(".sim")
                        .addEventListener("click", () => {
                          repositorio.deletar(id);
                          moda.current.fechar();
                        });
                      document
                        .querySelector(".nao")
                        .addEventListener("click", () => {
                          moda.current.fechar();
                        });
                    } else {
                      msg.current.Erro("Por favor, digite um ID válido!");
                    }
                  }}
                  className="apagar"
                >
                  Apagar
                </button>
              </div>
            )}

            {permissao === "admin" && (
              <button onClick={exportToExcel} className="btn-export">
                Exportar para Excel
              </button>
            )}
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
