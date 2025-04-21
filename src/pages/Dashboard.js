import Conteinner from "../components/Conteinner";
import Content from "../components/Content";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Slider";
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import ClienteRepository from "./servicos/Clientes/ClienteRepository";
import repositorioMercadoria from "./servicos/Mercadorias/Repositorio";
import repositorioStock from "./servicos/Stock.js/Repositorio";
import { repositorioVenda } from "./servicos/vendas/vendasRepositorio";
import Loading from "../components/loading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Função para agrupar dados por período
function agruparPorPeriodo(dados, periodo = "dia") {
  const agrupados = {};

  dados.forEach((item) => {
    let chave;
    const data = new Date(item.data);

    if (periodo === "dia") {
      chave = data.toISOString().split("T")[0];
    } else if (periodo === "semana") {
      const semana = Math.ceil(data.getDate() / 7);
      chave = `${data.getFullYear()}-M${data.getMonth() + 1}-W${semana}`;
    } else if (periodo === "mes") {
      chave = `${data.getFullYear()}-${data.getMonth() + 1}`;
    }

    if (!agrupados[chave]) {
      agrupados[chave] = 0;
    }
    agrupados[chave] += item.valor_total;
  });

  return {
    labels: Object.keys(agrupados),
    valores: Object.values(agrupados),
  };
}

function exportarParaExcel(dados, nomeArquivo = "dados.xlsx") {
  // Adiciona os dados básicos
  const wsDados = XLSX.utils.json_to_sheet(dados.infoBasica);

  // Modifica a planilha do gráfico para incluir todos os dados relevantes
  const wsGrafico = XLSX.utils.json_to_sheet(
    dados.grafico.map((venda) => ({
      ID: venda.idvendas,
      Quantidade: venda.quantidade,
      ValorUnitario: venda.valor_uni,
      Data: venda.data,
      ValorTotal: venda.valor_total,
      // Aqui você pode adicionar outras colunas se necessário
    }))
  );

  // Cria o workbook e adiciona as planilhas
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDados, "Dados");
  XLSX.utils.book_append_sheet(wb, wsGrafico, "Gráfico");

  // Converte para um buffer de Excel e cria o Blob
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

  // Salva o arquivo
  saveAs(blob, nomeArquivo);
}

export default function Dashboard() {
  const clientes = new ClienteRepository();
  const mercadoria = new repositorioMercadoria();
  const stok = new repositorioStock();
  const vendas = new repositorioVenda();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [cards, setCard] = useState([]);
  const [modelo2, setModelo2] = useState([]);
  const [entrada, setEntradada] = useState(0);
  const [saida, setSaida] = useState(0);
  const [useVenda, setVenda] = useState([]);
  const [useData, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dadosParaExportar, setDadosParaExportar] = useState(null);
  const [stockSelecionado,setLoteS] = useState(0)
  const [total, setTotal] = useState(0);
  const [quantidadetotal, setQuantidadeTotal] = useState(0);
  const [totalDivida, setTotalDivida] = useState(0);
  const [quantiDivida,setQuantiDivida] = useState(0);
  const [totalMerc ,setTotalMerc] = useState(0);
  const pieChartRef = useRef(null);
  const pieChartInstanceRef = useRef(null);
  
 var [quantidadeTotal,setQuant]=useState(0)
  const buscarCargo = () => sessionStorage.getItem("cargo");
  useEffect(() => {
    async function card() {
      setLoading(true);
      try {
        const vendasT = await vendas.leitura();
        const totalVendas = vendasT.reduce((acc, venda) => acc + venda.quantidade, 0);
        setQuant(totalVendas);
        const stk= await stok.leitura();
        const mercT = await mercadoria.leitura();
    
        var valorTotalVendas = 0
        var quantidadeTotal = 0;
        var quantidadeTotal2 = 0;
        var quantidadeDivida= 0;
         

        vendasT.forEach((e) => {
              e.mercadorias.forEach((o) => {
            
            
            
                    if (!stockSelecionado|| (stockSelecionado && stockSelecionado == o.stock.idstock)) {
                      if (e.status_p == "Em_Divida") {
                        quantidadeTotal2 += e.quantidade;
                        quantidadeDivida += e.valor_total;
                      }else{
                      quantidadeTotal += e.quantidade;
                      valorTotalVendas += e.valor_total;
                      }
              
                  } 
                
              });
            });
      
        setQuantiDivida(quantidadeDivida);
  
        setTotal(quantidadeTotal);
        setTotalDivida(quantidadeTotal2);
        setQuantidadeTotal(valorTotalVendas);




        setModelo2(stk)
        let cards2 = [
          await clientes.total(),
          totalMerc.toFixed(2),
          total ,
          totalDivida
        ];
        setCard(cards2);
  
        let mercadorias = await mercadoria.leitura();
        let contador1 = 0;
        let contador2 = 0;
  
        mercadorias.forEach((e) => {
          if (!stockSelecionado|| (stockSelecionado && stockSelecionado == e.stock.idstock)) {
          if (e.tipo!=null) {
            contador1 += e.quantidade_est;
          }
          if (e.tipo!=null) {
            contador2 += e.quantidade;
          }
        }
        });

         setTotalMerc(contador2)
        setEntradada(contador1.toFixed(2));
        setSaida(totalVendas.toFixed(2));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  
    card();
  }, [stockSelecionado,total,totalDivida,entrada]); // 🔹 Carrega os cartões uma única vez
  
  // Novo useEffect para definir os dados de exportação
  useEffect(() => {
    if (cards.length > 0) {  // 🔹 Certifica-se de que os dados já foram carregados antes de definir os dados para exportação
      async function setGrafico() {
        const dados = await vendas.leitura();
        const { labels, valores } = agruparPorPeriodo(dados, "mes");
        setVenda(valores);
        setData(labels);
  
        setDadosParaExportar({
          infoBasica: [
            { label: "Total Clientes", valor: cards[0] },
            { label: "Total Vendas", valor: Number(cards[3])+Number(cards[2]) },
            { label: "Total Mercadorias", valor: cards[1] },
            { label: "Total Vendas Pagas", valor: cards[2] },
            { label: "Total Vendas Devidas", valor: cards[3] },
            { label: "Total Saídas", valor: saida },
            { label: "Total Entradas", valor: entrada },
          ],
          grafico: dados,
          labels: labels,
        });
      }
  
      setGrafico();
    }
  }, [cards, entrada, saida]); // 🔹

    if (useVenda.length > 0 && useData.length > 0) {
      const ctx = chartRef.current.getContext("2d");
  
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
  
      chartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: useData,
          datasets: [
            {
              label: "Vendas",
              data: useVenda,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top" },
          },
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 10,
              },
            },
            y: {
              ticks: {
                stepSize: 1000,
                callback: function (value) {
                  return `${value} Mt`;
                },
              },
            },
          },
        },
      });
    }

    // Isso só será executado quando useVenda ou useData mudarem
    // grafico Pizza
    useEffect(() => {
      if (cards.length > 0 && pieChartRef.current) {
        const ctx = pieChartRef.current.getContext("2d");
    
        if (pieChartInstanceRef.current) {
          pieChartInstanceRef.current.destroy();
        }
    
        pieChartInstanceRef.current = new Chart(ctx, {
          type: "pie",
          data: {
            labels: ["Entradas", "Saidas"],
            datasets: [
              {
                data: [entrada, (Number(cards[3])+Number(cards[2])).toFixed(2)],
                backgroundColor: [
                  "rgba(54, 162, 235, 0.6)",
                  "rgba(255, 99, 132, 0.6)",
                ],
                borderColor: [
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 99, 132, 1)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
            },
          },
        });
      }
    }, [cards]);
    
  
  return (
    <>
      <Header></Header>
      <Conteinner>
        <Sidebar></Sidebar>
        <Content>
          {loading && <Loading></Loading>}
          <label>Filtrar por Stock:</label>
          <select value={stockSelecionado} onChange={(e) => setLoteS(e.target.value)}>
          <option>Selecione Um Stock</option>
            {modelo2.map((stock) => (
              <option key={stock.idstock} value={stock.idstock}>
                Stock {stock.tipo}
              </option>
            ))}
          </select>
          <div className="dashboard">
            <div className="card total-clients">
              <h3>Total Clientes</h3>
              <p id="totalClients">{cards[0]}</p>
            </div>
            <div className="card total-sales">
              <h3>Total Vendas</h3>
              <p id="totalSales">{(Number(cards[3])+Number(cards[2])).toFixed(2)} kg</p>
            </div>
            <div className="card total-sales">
              <h3> Vendas Pagas</h3>
              <p id="totalSales">{total.toFixed(2)} kg</p>
            </div>
            <div className="card total-sales">
              <h3> Vendas Em Divida</h3>
              <p id="totalSales">{totalDivida.toFixed(2)} kg</p>
            </div>
            {(buscarCargo() === "admin"|| buscarCargo()==="funcionario") && (
              <>
                <div className="card total-goods">
                  <h3>Total Mercadorias Disponiveis</h3>
                  <p id="totalGoods">{cards[1]} kg</p>
                </div>
                <div className="card total-stock">
                  <h3>Total Entradas</h3>
                  <p id="totalentrada">{entrada}</p>
                </div>
              </>
            )}
            <div className="card total-stock">
              <h3>Total Saídas</h3>
              <p id="totalsaida">{(Number(cards[3])+Number(cards[2])).toFixed(2)}</p>
            </div>
          </div>

          <div className="canvas_graficos ">
            <canvas id="salesChart "  ref={chartRef}></canvas>
          {/* grafico Pizza */}
          <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
            <h3 style={{ textAlign: "center" }}>Distribuição de Stock</h3>
            <canvas ref={pieChartRef}></canvas>
          </div>
          </div>

          {(buscarCargo()==="admin" && dadosParaExportar ) && (
              
              <button
              onClick={() =>
                exportarParaExcel(dadosParaExportar, "dashboard_dados.xlsx")
              }
              className="btn-export"
            >
              Baixar Relatório Excel
            </button>
          )}
        </Content>
      </Conteinner>
      <Footer></Footer>
    </>
  );
}
