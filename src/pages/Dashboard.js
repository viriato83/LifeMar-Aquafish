// DashboardFull.jsx
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
import { TrendingDown, TrendingUp, Users, Box, DollarSign, List } from "lucide-react";
import "./Dashboard.css"
/* =========================================================================
   DASHBOARD COMPLETO
   - KPIs (clientes, vendas pagas, em dívida, mercadorias, entradas, saídas)
   - Filtros: por Stock e por Mês (YYYY-MM)
   - Gráficos: Vendas (bar), Entradas x Saídas (mix), Distribuição por stock (pie)
   - Ranking de mercadorias
   - Resumo de Entradas (tabela)
   - Resumo Financeiro (dinheiro) — respeita os filtros
   - Exportar Excel com 4 abas (inclui Resumo_Financeiro)
   ========================================================================= */

export default function Dashboard() {
  // REPOSITORIES
  const clientes = new ClienteRepository();
  const mercadoria = new repositorioMercadoria();
  const stok = new repositorioStock();
  const vendas = new repositorioVenda();

  // REFS GRÁFICOS
  const chartRef = useRef(null);
  const mixedChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const mixedChartInstanceRef = useRef(null);
  const pieChartInstanceRef = useRef(null);

  // ESTADOS
  const [loading, setLoading] = useState(false);

  const [cards, setCard] = useState([]); // [totalClientes, totalMercadorias, vendasPagasQtd, vendasDividaQtd]
  const [modelo2, setModelo2] = useState([]); // stocks
  const [entrada, setEntradada] = useState(0); // total entradas (qtd)
  const [saida, setSaida] = useState(0); // total saídas (qtd)
  const [useVenda, setVenda] = useState([]); // dados gráfico vendas
  const [useData, setData] = useState([]); // labels gráfico
  const [dadosParaExportar, setDadosParaExportar] = useState(null);

  const [stockSelecionado, setLoteS] = useState(0); // 0 = todos
  const [mesSelecionado, setMesSelecionado] = useState(""); // "YYYY-MM"

  const [Dados2, setDados2] = useState([]); // mercadorias
  const [Dados3, setDados3] = useState([]); // vendas

  const [vendasPagasQtd, setVendasPagasQtd] = useState(0);
  const [vendasDividaQtd, setVendasDividaQtd] = useState(0);
  const [totalMerc, setTotalMerc] = useState(0);

  // AUX: agrupar por período (para gráfico)
  function agruparPorPeriodo(dados, periodo = "mes") {
    const agrupados = {};
    dados.forEach((item) => {
      const dt = new Date(item.data);
      let chave = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (periodo === "dia") chave = dt.toISOString().split("T")[0];
      if (!agrupados[chave]) agrupados[chave] = 0;
      agrupados[chave] += Number(item.valor_total || 0);
    });
    return { labels: Object.keys(agrupados), valores: Object.values(agrupados) };
  }

  // CARREGAR DADOS PRINCIPAIS
  useEffect(() => {
    async function carregarDashboard() {
      setLoading(true);
      try {
        // leitura
        const vendasT = await vendas.leitura();
        setDados3(vendasT);
        const stk = await stok.leitura();
        setModelo2(stk);
        const mercT = await mercadoria.leitura();
        setDados2(mercT);

        // clientes
        const totalClientes = await clientes.total();

        // métricas de vendas com filtros (pagas/divida em quantidade)
        let pagasQtd = 0;
        let dividaQtd = 0;
        let Valor_saida=0
        vendasT.forEach((v) => {
          const dv = new Date(v.data);
          const anoMes = `${dv.getFullYear()}-${String(dv.getMonth() + 1).padStart(2, "0")}`;
          let saidasQtd = 0;
          
          // respeita filtros
          const passaMes = !mesSelecionado || anoMes === mesSelecionado;
          const passaStock =
            !stockSelecionado ||
            stockSelecionado === 0 ||
            (Array.isArray(v.mercadorias) &&
              v.mercadorias.some((m) => m.stock && m.stock.idstock === stockSelecionado));

          if (passaMes && passaStock) {
            // contar quantidade vendida por itensVenda
            const qtd = v.itensVenda.reduce(
              (acc, it) => acc + (parseFloat(it.valor_tot) || 0),
              0
            );
            v.itensVenda.forEach((e)=>{
              Valor_saida+=e.quantidade
            })
            
          
             console.log(qtd) 
            setSaida(Number(Valor_saida));
            if (v.status_p === "Em_Divida") {
              dividaQtd += qtd;
            } else {
              pagasQtd += qtd;
            }
          }
        });

        setVendasPagasQtd(pagasQtd);
        setVendasDividaQtd(dividaQtd);

        // métricas mercadorias (entradas/saídas e total mercadorias)
        let entradasQtd = 0;
        let totalMercadorias = 0;

        mercT.forEach((m) => {
          const dm = new Date(m.data_entrada);
          const anoMes = `${dm.getFullYear()}-${String(dm.getMonth() + 1).padStart(2, "0")}`;

          const passaMes = !mesSelecionado || anoMes === mesSelecionado;
          const passaStock =
            !stockSelecionado ||
            stockSelecionado === 0 ||
            (m.stock && m.stock.idstock === stockSelecionado);

          if (passaMes && passaStock) {
            entradasQtd += Number(m.quantidade_est || 0);
            // assumindo “saídas” = quantidade vendida daquela mercadoria (se tiveres campo próprio, ajusta aqui)
           
            totalMercadorias += Number(m.quantidade || 0);
          }
        });

        setEntradada(Number(entradasQtd.toFixed(2)));
     
        setTotalMerc(totalMercadorias);

        // cards (ordem antiga): clientes, total mercadorias, vendas pagas (qtd), vendas em dívida (qtd)
        setCard([totalClientes, totalMercadorias, pagasQtd, dividaQtd]);
      } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    carregarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockSelecionado, mesSelecionado]);

  // PREPARAR DADOS PARA GRÁFICOS E EXCEL
  useEffect(() => {
    async function setGraficoEExport() {
      const dadosV = await vendas.leitura();
      const dadosM = await mercadoria.leitura();
      setDados2(dadosM);

      // gráfico vendas (mensal)
      const { labels, valores } = agruparPorPeriodo(dadosV, "mes");
      setData(labels);
      setVenda(valores);

      // info básica para Excel
      setDadosParaExportar({
        infoBasica: [
          { label: "Total Clientes", valor: Number(cards[0] || 0) },
          { label: "Total Mercadorias", valor: Number(cards[1] || 0) },
          { label: "Vendas Pagas (Qtd)", valor: Number(cards[2] || 0) },
          { label: "Vendas em Dívida (Qtd)", valor: Number(cards[3] || 0) },
          { label: "Entradas (Qtd)", valor: Number(entrada || 0) },
          { label: "Saídas (Qtd)", valor: Number(saida || 0) },
        ],
        grafico: dadosV,
      });
    }
    setGraficoEExport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, entrada, saida]);

  // GRÁFICO: Vendas (bar)
  useEffect(() => {
    if (!chartRef.current) return;
    if (!useData || useData.length === 0) return;

    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: useData,
        datasets: [
          {
            label: "Vendas (MT)",
            data: useVenda,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#334155", // cinza-escuro suave
              font: { size: 11, family: "Inter, sans-serif" },
              boxWidth: 14,
              boxHeight: 10,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.8)",
            titleFont: { size: 11, family: "Inter, sans-serif" },
            bodyFont: { size: 11, family: "Inter, sans-serif" },
            padding: 8,
            cornerRadius: 6,
            displayColors: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#475569",
              font: { size: 10, family: "Inter, sans-serif" },
              maxRotation: 30,
              minRotation: 0,
            },
            grid: {
              display: false,
            },
            title: {
              display: true,
              text: "Período (Mês/Ano)",
              color: "#1e293b",
              font: { size: 11, weight: "600", family: "Inter, sans-serif" },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#475569",
              font: { size: 10, family: "Inter, sans-serif" },
              callback: (v) => `${v} Mt`,
            },
            title: {
              display: true,
              text: "Vendas (MT)",
              color: "#1e293b",
              font: { size: 11, weight: "600", family: "Inter, sans-serif" },
            },
            grid: {
              color: "rgba(0,0,0,0.05)",
              drawBorder: false,
            },
          },
        },
        layout: {
          padding: 12,
        },
      
      
      },
    });
  }, [useVenda, useData]);

  // GRÁFICO: Entradas x Saídas (mix)
  useEffect(() => {
    async function montarGraficoCombinado() {
      const vendasDados = await vendas.leitura();
      const mercDados = await mercadoria.leitura();

      const mapVendas = {};
      vendasDados.forEach((v) => {
        const d = new Date(v.data);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        // respeita filtros
        const passaMes = !mesSelecionado || chave === mesSelecionado;
        const passaStock =
          !stockSelecionado ||
          stockSelecionado === 0 ||
          (Array.isArray(v.mercadorias) &&
            v.mercadorias.some((m) => m.stock && m.stock.idstock === stockSelecionado));
        if (!passaMes || !passaStock) return;

        mapVendas[chave] = (mapVendas[chave] || 0) + Number(v.valor_total || 0);
      });

      const mapEntradas = {};
      mercDados.forEach((m) => {
        const d = new Date(m.data_entrada);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        const passaMes = !mesSelecionado || chave === mesSelecionado;
        const passaStock =
          !stockSelecionado ||
          stockSelecionado === 0 ||
          (m.stock && m.stock.idstock === stockSelecionado);
        if (!passaMes || !passaStock) return;

        // entradas em quantidade
        mapEntradas[chave] = (mapEntradas[chave] || 0) + Number(m.quantidade_est || 0);
      });

      const labelsSet = new Set([...Object.keys(mapVendas), ...Object.keys(mapEntradas)]);
      const labelsArr = Array.from(labelsSet).sort();

      const vendasVals = labelsArr.map((l) => mapVendas[l] || 0);
      const entradasVals = labelsArr.map((l) => mapEntradas[l] || 0);

      if (!mixedChartRef.current) return;
      const ctx = mixedChartRef.current.getContext("2d");
      if (mixedChartInstanceRef.current) mixedChartInstanceRef.current.destroy();

      mixedChartInstanceRef.current = new Chart(ctx, {
        data: {
          labels: labelsArr,
          datasets: [
            {
              type: "bar",
              label: "Vendas (MT)",
              data: vendasVals,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
            {
              type: "line",
              label: "Entradas (Qtd)",
              data: entradasVals,
              borderColor: "rgba(54, 162, 235, 1)",
              tension: 0.3,
              fill: false,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: "#334155", // cinza-escuro elegante
                font: { size: 11, family: "Inter, sans-serif" },
                boxWidth: 14,
                boxHeight: 10,
              },
            },
            tooltip: {
              backgroundColor: "rgba(0,0,0,0.8)",
              titleFont: { size: 11, family: "Inter, sans-serif" },
              bodyFont: { size: 11, family: "Inter, sans-serif" },
              padding: 8,
              cornerRadius: 6,
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#475569",
                font: { size: 10, family: "Inter, sans-serif" },
                maxRotation: 30,
                minRotation: 0,
              },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              position: "left",
              ticks: {
                color: "#475569",
                font: { size: 10, family: "Inter, sans-serif" },
                callback: (v) => `${v} MT`,
              },
              title: {
                display: true,
                text: "Vendas (MT)",
                color: "#1e293b",
                font: { size: 11, family: "Inter, sans-serif", weight: "600" },
              },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
            y1: {
              beginAtZero: true,
              position: "right",
              ticks: {
                color: "#475569",
                font: { size: 10, family: "Inter, sans-serif" },
                callback: (v) => `${v} Qtd`,
              },
              title: {
                display: true,
                text: "Entradas (Qtd)",
                color: "#1e293b",
                font: { size: 11, family: "Inter, sans-serif", weight: "600" },
              },
              grid: { drawOnChartArea: false },
            },
          },
          layout: {
            padding: 12,
          },
        }
        
      });
    }
    montarGraficoCombinado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionado, stockSelecionado]);

  // GRÁFICO: Pizza distribuição por stock
  useEffect(() => {
    async function montarPie() {
      const mercDados = await mercadoria.leitura();
      const mapa = {};
      mercDados.forEach((m) => {
        // respeita filtros
        const d = new Date(m.data_entrada);
        const chaveMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (mesSelecionado && chaveMes !== mesSelecionado) return;
        if (stockSelecionado && stockSelecionado !== 0 && m.stock && m.stock.idstock !== stockSelecionado) return;

        const id = m.stock?.idstock ?? "SemStock";
        mapa[id] = (mapa[id] || 0) + Number(m.quantidade || 0);
      });

      const labels = Object.keys(mapa);
      const valores = labels.map((l) => mapa[l]);

      if (!pieChartRef.current) return;
      const ctx = pieChartRef.current.getContext("2d");
      if (pieChartInstanceRef.current) pieChartInstanceRef.current.destroy();

      pieChartInstanceRef.current = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: valores,
              backgroundColor: [
                "rgba(54,162,235,0.6)",
                "rgba(255,99,132,0.6)",
                "rgba(255,206,86,0.6)",
                "rgba(75,192,192,0.6)",
                "rgba(153,102,255,0.6)",
              ],
            },
          ],
        },
        options: { responsive: true },
      });
    }
    montarPie();
  }, [mesSelecionado, stockSelecionado, mercadoria]);

  // RANKING MERCADORIAS
  const [ranking, setRanking] = useState([]);
  useEffect(() => {
    async function gerarRanking() {
      const vendasDados = await vendas.leitura();
      const mapa = {};

      vendasDados.forEach((v) => {
        const dv = new Date(v.data);
        const anoMes = `${dv.getFullYear()}-${String(dv.getMonth() + 1).padStart(2, "0")}`;
        const passaMes = !mesSelecionado || anoMes === mesSelecionado;
        const passaStock =
          !stockSelecionado ||
          stockSelecionado === 0 ||
          (Array.isArray(v.mercadorias) &&
            v.mercadorias.some((m) => m.stock && m.stock.idstock === stockSelecionado));
        if (!passaMes || !passaStock) return;

        v.mercadorias?.forEach((m) => {
          const k = m.nome || "Mercadoria";
          mapa[k] = (mapa[k] || 0) + Number(m.quantidade || 0);
        });
      });

      const arr = Object.entries(mapa).map(([nome, qtd]) => ({ nome, qtd }));
      arr.sort((a, b) => b.qtd - a.qtd);
      setRanking(arr.slice(0, 8));
    }
    gerarRanking();
  }, [mesSelecionado, stockSelecionado, vendas]);

  // FORMATAÇÃO
  const formatNumber = (n) => Number(n || 0).toLocaleString();
  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 }) + " Mt";

  // CÁLCULOS RESUMO FINANCEIRO (compartilhado com Excel)
  function calcularResumoFinanceiro(mercadorias = [], vendasLista = [], mes = "", stockId = 0) {
    const mercadoriasFiltradas = (mercadorias || []).filter((m) => {
      const dt = new Date(m.data_entrada);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (mes && ym !== mes) return false;
      if (stockId && stockId !== 0 && m.stock && m.stock.idstock !== stockId) return false;
      return true;
    });

    const vendasFiltradas = (vendasLista || []).filter((v) => {
      const dt = new Date(v.data);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (mes && ym !== mes) return false;
      const passaStock =
        !stockId ||
        stockId === 0 ||
        (Array.isArray(v.mercadorias) &&
          v.mercadorias.some((m) => m.stock && m.stock.idstock === stockId));
      return passaStock;
    });

    const valorEntradas = mercadoriasFiltradas.reduce(
      (acc, m) => acc + Number(m.valor_total || 0),
      0
    );
    const valorDisponivel = mercadoriasFiltradas.reduce(
      (acc, m) => acc + Number(m.valor_un || 0) * Number(m.quantidade || 0),
      0
    );
    const valorVendas = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.valor_total || 0),
      0
    );
    const valorDividas = vendasFiltradas
      .filter((v) => v.status_p === "Em_Divida")
      .reduce((acc, v) => acc + Number(v.valor_total || 0), 0);

    const lucroEstimado = valorVendas - valorEntradas;
    return { valorEntradas, valorDisponivel, valorVendas, valorDividas, lucroEstimado };
  }
  const buscarCargo = () => {
    return sessionStorage.getItem("cargo");
  };

  // EXPORTAR EXCEL (4 abas, filtrado)
  // EXPORTAR EXCEL (4 abas, filtrado)
function exportarParaExcel(nomeArquivo = "dashboard_dados.xlsx") {
  // --- 1) Resumo_Básico montado com os ESTADOS atuais ---
  const infoBasica = [
    { label: "Total Clientes", valor: Number(cards[0] || 0) },
    { label: "Total Mercadorias", valor: Number(cards[1] || 0) },
    { label: "Vendas Pagas (Qtd)", valor: Number(cards[2] || 0) },
    { label: "Vendas em Dívida (Qtd)", valor: Number(cards[3] || 0) },
    { label: "Entradas (Qtd)", valor: Number(entrada || 0) },
    { label: "Saídas (Qtd)", valor: Number(saida || 0) },
  ];

  const wsDados = XLSX.utils.json_to_sheet(infoBasica);

  // --- 2) Entradas (mercadorias) filtradas pelos filtros atuais ---
  const mercadoriasFiltradas = (Dados2 || []).filter((m) => {
    const d = new Date(m.data_entrada);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (mesSelecionado && ym !== mesSelecionado) return false;
    if (stockSelecionado && stockSelecionado !== 0 && m.stock && m.stock.idstock !== stockSelecionado) {
      return false;
    }
    return true;
  });

  const wsEntradas = XLSX.utils.json_to_sheet(
    mercadoriasFiltradas.map((m) => ({
      ID: m.idmercadoria,
      Nome: m.nome,
      Quantidade_Entrada: Number(m.quantidade_est || 0),
      Quantidade_Disponivel: Number(m.quantidade || 0),
      Valor_Unitario: Number(m.valor_un || 0),
      Valor_Total_Entrada: Number(m.valor_total || 0),
      Data_Entrada: m.data_entrada,
      Stock: m.stock?.idstock ?? "",
      Usuario: m.usuario == null ? "0" : m.usuario.login,
    }))
  );

  const totQtdEntrada = mercadoriasFiltradas.reduce(
    (a, m) => a + Number(m.quantidade_est || 0),
    0
  );
  const totQtdDisp = mercadoriasFiltradas.reduce(
    (a, m) => a + Number(m.quantidade || 0),
    0
  );
  const totValorEntrada = mercadoriasFiltradas.reduce(
    (a, m) => a + Number(m.valor_total || 0),
    0
  );
  const totValorDisp = mercadoriasFiltradas.reduce(
    (a, m) => a + Number(m.valor_un || 0) * Number(m.quantidade_est || 0),
    0
  );

  XLSX.utils.sheet_add_json(
    wsEntradas,
    [
      {
        ID: "TOTAL",
        Quantidade_Entrada: totQtdEntrada,
        Quantidade_Disponivel: totQtdDisp,
        Valor_Total_Entrada: Number(totValorEntrada.toFixed(2)),
        Valor_Total_Disponivel: Number(totValorDisp.toFixed(2)),
      },
    ],
    { skipHeader: true, origin: -1 }
  );

  // --- 3) Vendas filtradas (usa Dados3 em vez de dados.grafico) ---
  const vendasFiltradas = (Dados3 || []).filter((v) => {
    const d = new Date(v.data);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (mesSelecionado && ym !== mesSelecionado) return false;

    const passaStock =
      !stockSelecionado ||
      stockSelecionado === 0 ||
      (Array.isArray(v.mercadorias) &&
        v.mercadorias.some((m) => m.stock && m.stock.idstock === stockSelecionado));
    return passaStock;
  });

  const wsVendas = XLSX.utils.json_to_sheet(
    vendasFiltradas.map((v) => ({
      ID: v.idvendas,
      Quantidade: Array.isArray(v.itensVenda)
        ? v.itensVenda.reduce((acc, it) => acc + Number(it.quantidade || 0), 0)
        : Number(v.quantidade || 0),
      Valor_Unitario: Number(v.valor_uni || 0),
      Valor_Total: Number(v.valor_total || 0),
      Status: v.status_p,
      Data: v.data,
      Mercadorias: Array.isArray(v.mercadorias)
        ? v.mercadorias.map((e) => e.nome).join(", ")
        : "",
      Usuario: v.usuario == null ? "0" : v.usuario.login,
    }))
  );

  const totQtdVendida = vendasFiltradas.reduce(
    (acc, v) =>
      acc +
      (Array.isArray(v.itensVenda)
        ? v.itensVenda.reduce((acc2, it) => acc2 + Number(it.quantidade || 0), 0)
        : Number(v.quantidade || 0)),
    0
  );
  const totValorVendas = vendasFiltradas.reduce(
    (acc, v) => acc + Number(v.valor_total || 0),
    0
  );
  const totValorDivida = vendasFiltradas
    .filter((v) => v.status_p === "Em_Divida")
    .reduce((acc, v) => acc + Number(v.valor_total || 0), 0);

  XLSX.utils.sheet_add_json(
    wsVendas,
    [{ ID: "TOTAL", Quantidade: totQtdVendida, Valor_Total: Number(totValorVendas.toFixed(2)) }],
    { skipHeader: true, origin: -1 }
  );
  XLSX.utils.sheet_add_json(
    wsVendas,
    [{ ID: "TOTAL_Divida", Valor_Total: Number(totValorDivida.toFixed(2)) }],
    { skipHeader: true, origin: -1 }
  );

  // --- 4) Resumo Financeiro (já usas calcularResumoFinanceiro) ---
  const resumo = calcularResumoFinanceiro(Dados2, Dados3, mesSelecionado, stockSelecionado);
  const wsFinanceiro = XLSX.utils.json_to_sheet([
    { Descricao: "Valor Total de Entradas", Valor: Number(resumo.valorEntradas.toFixed(2)) },
    { Descricao: "Valor Total Disponível (Stock)", Valor: Number(resumo.valorDisponivel.toFixed(2)) },
    { Descricao: "Valor Total de Vendas", Valor: Number(resumo.valorVendas.toFixed(2)) },
    { Descricao: "Valor em Dívidas", Valor: Number(resumo.valorDividas.toFixed(2)) },
    { Descricao: "Lucro Estimado (Vendas - Entradas)", Valor: Number(resumo.lucroEstimado.toFixed(2)) },
    { Descricao: "Mês (filtro)", Valor: mesSelecionado || "Todos" },
    { Descricao: "Stock (filtro)", Valor: stockSelecionado === 0 ? "Todos" : stockSelecionado },
  ]);

  // --- montar workbook ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDados, "Resumo_Básico");
  XLSX.utils.book_append_sheet(wb, wsVendas, "Vendas (filtrado)");
  XLSX.utils.book_append_sheet(wb, wsEntradas, "Entradas (filtrado)");
  XLSX.utils.book_append_sheet(wb, wsFinanceiro, "Resumo_Financeiro");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, nomeArquivo);
}


  // RENDER
  return (
    <>
      <Header />
      
      <Conteinner>
        <Sidebar />
        <Content>
          {loading && <Loading />}

          {/* FILTROS + EXPORT */}
          <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 600 }}>Filtrar por Stock:</label>
              <select
                value={stockSelecionado}
                onChange={(e) => setLoteS(Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 8 }}
              >
                <option value={0}>Todos os Stocks</option>
                {modelo2.map((stock) => (
                  <option key={stock.idstock} value={stock.idstock}>
                    {stock.tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>Filtrar por Mês:</label>
              <input
                type="month"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                style={{ padding: 8, borderRadius: 8 }}
              />
            </div>

            <div>
            {(buscarCargo() !== "vendedor")? (
            <button
  className="btn-export"
  onClick={() => exportarParaExcel("dashboard_dados.xlsx")}
>
  📥 Exportar Excel (com Resumo Financeiro)
</button>
            ):("")}

            </div>
          </div>

          {/* KPI CARDS */}
          <div className="cards-grid">
            <KpiCard title="Total Clientes" value={formatNumber(cards[0] || 0)} icon={<Users />} color="#4fc3f7" />
            <KpiCard title="Vendas Pagas" value={formatNumber(vendasPagasQtd) +" Mt"} icon={<TrendingUp />} color="#66bb6a" />
            {(buscarCargo() !== "vendedor")? (
              <>
            <KpiCard title="Vendas em Dívida (Qtd)" value={formatNumber(vendasDividaQtd) +" Mt"} icon={<TrendingDown />} color="#ef5350" />
            <KpiCard title="Total Mercadorias Disponiveis" value={formatNumber(totalMerc)} icon={<Box />} color="#ffa726" />
            <KpiCard title="Total Entradas (Qtd)" value={formatNumber(entrada)} icon={<List />} color="#42a5f5" />
            <KpiCard title="Total Saídas (Qtd)" value={formatNumber(saida)} icon={<DollarSign />} color="#7e57c2" />
            </>
            ):("")}
            
          </div>

          {/* CHARTS */}
          <div className="charts-row">
            <div className="chart-card">
              <h4>Vendas Mensais</h4>
              <canvas ref={chartRef} />
            </div>

            <div className="chart-card">
              <h4>Entradas x Vendas (Mensal)</h4>
              <canvas ref={mixedChartRef} />
            </div>

              {(buscarCargo() !== "vendedor")? (
            <div className="small-cards">
              {/* <div className="chart-card small">
                <h4>Distribuição por Stock</h4>
                <canvas ref={pieChartRef} />
              </div> */}
              <div className="chart-card small">
                <h4>Ranking Mercadorias</h4>
                <ol className="ranking-list">
                  {ranking.map((r, idx) => (
                    <li key={r.nome}>
                      <strong>{idx + 1}.</strong> {r.nome} — <em>{formatNumber(r.qtd)} kg</em>
                    </li>
                  ))}
                  {ranking.length === 0 && <li>Nenhuma venda registada</li>}
                </ol>
              </div>
            </div>
                 ):("")}
          </div>
          {/* TABELA RESUMO ENTRADAS */}
          {(buscarCargo() !== "vendedor")? (
            <>
          <div className="table-card">
            <h3>Resumo de Entradas (filtrado)</h3>
            <ResumoTabela
              mercadorias={Dados2}
              mesSelecionado={mesSelecionado}
              stockSelecionado={stockSelecionado}
            />
          </div>


          <div className="table-card">
            <ResumoFinanceiro
              mercadorias={Dados2}
              vendas={Dados3}
              mesSelecionado={mesSelecionado}
              stockSelecionado={stockSelecionado}
              />
          </div>
          </>
            ):("")}
          
        </Content>
      </Conteinner>
      <Footer />

      {/* estilos mínimos (ajusta conforme teu CSS/Tailwind) */}
      <style>{`
        .charts-row {
  display: grid;
  grid-template-columns: 3fr;
  gap: 24px;
  margin-top: 20px;
  margin-bottom: 20px;
}
@media (min-width: 1100px) {
  .charts-row {
    grid-template-columns: repeat(3, 1fr);
  }
}


/* Corrige layout do gráfico de pizza */
.chart-card.small canvas {
  width: 100% !important;
  height: 320px !important;
  max-height: 340px !important;
  margin: auto;
  display: block;
}

      `}</style>
    </>
  );
}

/* =========================
   COMPONENTES AUXILIARES
   ========================= */

function KpiCard({ title, value, icon, color }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: color }}>{icon}</div>
      <div className="kpi-text">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </div>
  );
}

function ResumoTabela({ mercadorias = [], mesSelecionado, stockSelecionado }) {
  const filtradas = (mercadorias || []).filter((m) => {
    if (!m) return false;
    const d = new Date(m.data_entrada);
    if (Number.isNaN(d.getTime())) return false;
    const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (mesSelecionado && anoMes !== mesSelecionado) return false;
    if (stockSelecionado && stockSelecionado !== 0 && m.stock && m.stock.idstock !== stockSelecionado) return false;
    return true;
  });

  const totalQuantidadeEst = filtradas.reduce((acc, m) => acc + Number(m.quantidade_est || 0), 0);
  const totalQuantidadeDisp = filtradas.reduce((acc, m) => acc + Number(m.quantidade || 0), 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <small>Registos: {filtradas.length}</small>
        <div>
          <small style={{ marginRight: 12 }}>Total Entradas: {totalQuantidadeEst.toFixed(2)}</small>
          <small>Total Disponível: {totalQuantidadeDisp.toFixed(2)}</small>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 8 }}>ID</th>
            <th>Nome</th>
            <th>Quantidade Est.</th>
            <th>Disponível</th>
            <th>Valor Unit.</th>
            <th>Valor Total</th>
            <th>Data Entrada</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.map((m,i) => { if(i<=19){return (
            <tr key={m.idmercadoria} style={{ borderBottom: "1px solid #fafafa" }}>
              <td style={{ padding: 8 }}>{m.idmercadoria}</td>
              <td>{m.nome}</td>
              <td>{Number(m.quantidade_est || 0).toFixed(2)}</td>
              <td>{Number(m.quantidade || 0).toFixed(2)}</td>
              <td>{Number(m.valor_un || 0).toFixed(2)}</td>
              <td>{Number(m.valor_total || 0).toFixed(2)}</td>
              <td>{m.data_entrada}</td>
              <td>{m.stock?.idstock ?? ""}</td>
            </tr>
          )}})}
          {filtradas.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 12, textAlign: "center" }}>
                Nenhum registo encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ResumoFinanceiro({ mercadorias = [], vendas = [], mesSelecionado, stockSelecionado }) {
  // mesma função usada no Excel
  const resumo = (function calcular(mercadoriasList, vendasList, mes, stockId) {
    const mercs = (mercadoriasList || []).filter((m) => {
      const dt = new Date(m.data_entrada);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (mes && ym !== mes) return false;
      if (stockId && stockId !== 0 && m.stock && m.stock.idstock !== stockId) return false;
      return true;
    });

    const vends = (vendasList || []).filter((v) => {
      const dt = new Date(v.data);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (mes && ym !== mes) return false;
      return (
        !stockId ||
        stockId === 0 ||
        (Array.isArray(v.mercadorias) &&
          v.mercadorias.some((m) => m.stock && m.stock.idstock === stockId))
      );
    });

    const valorEntradas = mercs.reduce((acc, m) => acc + Number(m.valor_total || 0), 0);
    const valorDisponivel = mercs.reduce(
      (acc, m) => acc + Number(m.valor_un || 0) * Number(m.quantidade || 0),
      0
    );
    const valorVendas = vends.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    const valorDividas = vends
      .filter((v) => v.status_p === "Em_Divida")
      .reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    const lucroEstimado = valorVendas - valorEntradas;

    return { valorEntradas, valorDisponivel, valorVendas, valorDividas, lucroEstimado };
  })(mercadorias, vendas, mesSelecionado, stockSelecionado);

  const fmt = (n) => Number(n || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 }) + " Mt";

  return (
    <div
      style={{
        marginTop: 8,
        padding: 16,
        borderRadius: 10,
        background: "#f8f9fa",
        boxShadow: "0 0 5px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ marginBottom: 12 }}>💰 Resumo Financeiro</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ padding: 6 }}>Valor Total de Entradas:</td>
            <td style={{ padding: 6, fontWeight: "bold" }}>{fmt(resumo.valorEntradas)}</td>
          </tr>
          <tr>
            <td style={{ padding: 6 }}>Valor Total Disponível (Stock):</td>
            <td style={{ padding: 6, fontWeight: "bold" }}>{fmt(resumo.valorDisponivel)}</td>
          </tr>
          <tr>
            <td style={{ padding: 6 }}>Valor Total de Vendas:</td>
            <td style={{ padding: 6, fontWeight: "bold" }}>{fmt(resumo.valorVendas)}</td>
          </tr>
          <tr>
            <td style={{ padding: 6 }}>Valor em Dívidas:</td>
            <td style={{ padding: 6, fontWeight: "bold", color: "#d9534f" }}>{fmt(resumo.valorDividas)}</td>
          </tr>
          <tr>
            <td style={{ padding: 6 }}>Lucro Estimado (Vendas - Entradas):</td>
            <td style={{ padding: 6, fontWeight: "bold", color: "#28a745" }}>{fmt(resumo.lucroEstimado)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
