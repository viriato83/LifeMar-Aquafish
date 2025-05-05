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
  const [mesSelecionado, setMesSelecionado] = useState("");

  const [total, setTotal] = useState(0);
  const [quantidadetotal, setQuantidadeTotal] = useState(0);
  const [totalDivida, setTotalDivida] = useState(0);
  const [quantiDivida,setQuantiDivida] = useState(0);
  const [totalMerc ,setTotalMerc] = useState(0);
  const pieChartRef = useRef(null);
  const pieChartInstanceRef = useRef(null);
  
 var [quantidadeTotal,setQuant]=useState(0)
  const buscarCargo = () => sessionStorage.getItem("cargo");
  
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
      const vendasFiltradas = dados.grafico
      .filter((venda) => {
        const dataVenda = new Date(venda.data);
        const anoMes = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;

        return venda.mercadorias.some((o) => {
          return (
            (!mesSelecionado || anoMes === mesSelecionado) &&
            (!stockSelecionado || stockSelecionado == o.stock.idstock)
          );
        });
      });

    const wsGrafico = XLSX.utils.json_to_sheet(
      vendasFiltradas.map((venda) => ({
        ID: venda.idvendas,
        Quantidade: venda.quantidade.toFixed(2).replace('.', ','),
        ValorUnitario: venda.valor_uni,
        Data: venda.data,
        ValorTotal: venda.valor_total.toFixed(2).replace('.', ','),
        Mercadoria: venda.mercadorias.map((e) => e.nome).join(', ')
      }))
    );

    // Calcular totais
    const totalQuantidade = vendasFiltradas.reduce((acc, venda) => acc + venda.quantidade, 0);
    const totalValor = vendasFiltradas.reduce((acc, venda) => acc + venda.valor_total, 0);

    // Adicionar linha com totais
    XLSX.utils.sheet_add_json(wsGrafico, [{
      ID: 'TOTAL',
      Quantidade: totalQuantidade.toFixed(2).replace('.', ','),
      ValorTotal: totalValor.toFixed(2).replace('.', ',')
    }], { skipHeader: true, origin: -1 });  // origin -1 adiciona ao final

      
  

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

  useEffect(() => {
    async function card() {
      setLoading(true);
      try {
        const vendasT = await vendas.leitura();
        // console.log(vendasT.map((venda)=>
        //   venda.mercadorias.map((e)=>{
        //     return e.nome
        //   })
        // ))
        const totalVendas = vendasT.reduce((acc, venda) => acc + venda.quantidade, 0);
        setQuant(totalVendas);
        const stk= await stok.leitura();
        const mercT = await mercadoria.leitura();
    
        var valorTotalVendas = 0
        var quantidadeTotal = 0;
        var quantidadeTotal2 = 0;
        var quantidadeDivida= 0;
   
        vendasT.forEach((e) => {
          //fintros e calculo  das quantidades totais 
          const dataVenda = new Date(e.data);
          const anoMes = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
          
  
              e.mercadorias.forEach((o) => {
            
            
            
                    if (   (!mesSelecionado || anoMes === mesSelecionado) && (!stockSelecionado|| (stockSelecionado && stockSelecionado == o.stock.idstock))) {
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
     
          const dataMercadoria = new Date(e.data_entrada);
          const anoMes = `${dataMercadoria.getFullYear()}-${String(dataMercadoria.getMonth() + 1).padStart(2, '0')}`;
          
          if ( (!mesSelecionado || anoMes === mesSelecionado) &&(!stockSelecionado|| (stockSelecionado && stockSelecionado == e.stock.idstock))) {
          if (e.tipo!=null) {
            contador1 += e.quantidade_est;
          }
          if (e.tipo!=null) {
            contador2 += e.quantidade;
          }
          console.log('anoMes:', anoMes, 'mesSelecionado:', e.data);

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
  }, [stockSelecionado,total,totalDivida,entrada,mesSelecionado]); // 🔹 Carrega os cartões uma única vez
  
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
            { label: "Total Clientes", valor: Number(cards[0]).toFixed(2).replace('.', ',') },
            { label: "Total Vendas", valor: (Number(cards[3]) + Number(cards[2])).toFixed(2).replace('.', ',') },
            { label: "Total Mercadorias", valor: Number(cards[1]).toFixed(2).replace('.', ',') },
            { label: "Total Vendas Pagas", valor: Number(cards[2]).toFixed(2).replace('.', ',')},
            { label: "Total Vendas Devidas", valor: Number(cards[3]).toFixed(2).replace('.', ',') },
            { label: "Total Saídas", valor: Number(saida).toFixed(2).replace('.', ',')},
            { label: "Total Entradas", valor: Number(entrada).toFixed(2).replace('.', ',')},
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
          <label>Filtrar por Mês:</label>
            <input
              type="month"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              style={{ marginBottom: "1rem", display: "block" }}
            />

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
            {(buscarCargo() === "admin"|| buscarCargo()==="gerente") && (
              
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
