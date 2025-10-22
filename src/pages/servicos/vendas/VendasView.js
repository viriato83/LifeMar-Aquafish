import { useEffect, useState, useRef } from "react";
import Header from "../../../components/Header";
import Conteinner from "../../../components/Conteinner";
import Slider from "../../../components/Slider";
import Content from "../../../components/Content";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../../components/modal";
import Mensagem from "../../../components/mensagem";
import Footer from "../../../components/Footer";
import { repositorioVenda } from "./vendasRepositorio";
import Loading from "../../../components/loading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ClienteRepository from "../Clientes/ClienteRepository";
import repositorioStock from "../Stock.js/Repositorio";
import repositorioMercadoria from "../Mercadorias/Repositorio";
import { ItemRepository } from "./VendaItem/ItemRepository";
import Item from "./VendaItem/Item";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IoMdArrowRoundBack } from "react-icons/io";

export default function VendasView() {
  const repositorio = new repositorioVenda();
  const repoStco= new repositorioStock()
  const repositorioMerc= new repositorioMercadoria()
  const [modelo, setModelo] = useState([]);
  const [modelo2, setModelo2] = useState([]);
  const [total, setTotal] = useState(0);
  const [quantidadeTotal, setQuantidadeTotal] = useState(0);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const repositorioClient= new ClienteRepository()
  const msg = useRef(null);
  const moda = useRef(null);
  const [stockSelecionado,setLoteS] = useState(0);
  const [mesSelecionado, setMesSelecionado] = useState("");
  const Itemrepositorio= new ItemRepository();
  const[Item,setItem]=useState([])

  const [totalDivida, setTotalDivida] = useState(0);
  const [quantiDivida,setQuantiDivida] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
const [mensagem, setMensagem] = useState("");
const [clienteParaPagar, setClienteParaPagar] = useState(null);
const[Data,setData]=useState("")
const handlePagarClick = (elemento) => {
  setMensagem(`Deseja validar o pagamento do ${elemento.cliente.nome}?`);
  setClienteParaPagar(elemento);
  setModalOpen(true);
};

const confirmarPagamento = async () => {
  try {
    await pagar(clienteParaPagar.cliente.idclientes, clienteParaPagar.idvendas);

  } catch (err) {
    console.error("Erro ao pagar:", err);
    alert("Erro ao efetuar pagamento.");
  } finally {
    setModalOpen(false);
    window.location.reload(); // Só recarrega após conclusão
  }
};

 
  useEffect(() => {
    msg.current = new Mensagem();
    moda.current = new Modal();
    
    async function carregarDados() {
      setLoading(true);
      try {
        const dadosModelo = await repositorio.leitura();
        const repositoriomerc = await repositorioMerc.leitura();
        const repoStck = await repoStco.leitura();
        const item= await Itemrepositorio.leitura();
        const dadosTotal = await repositorio.total();
        const quantidadeTotalVendas = dadosModelo.reduce((acc, venda) => acc + venda.valor_total, 0);
        var valorTotalVendas = 0
        var quantidadeTotal = 0;
        var quantidadeTotal2 = 0;
        var quantidadeDivida= 0;
         

        dadosModelo.forEach((e) => {
          
          const dataMercadoria = new Date(e.data);
          const anoMes = `${dataMercadoria.getFullYear()}-${String(dataMercadoria.getMonth() + 1).padStart(2, '0')}`;
          
         
              e.mercadorias.forEach((o) => {
            
            
            
                if ( (!mesSelecionado || anoMes === mesSelecionado)&&(!stockSelecionado|| (stockSelecionado && stockSelecionado == o.stock.idstock))) {
                    setData(anoMes)
                      if (e.status_p == "Em_Divida") {
                        e.itensVenda.forEach((item) => {
                          quantidadeTotal2 += item.quantidade;
                          quantidadeDivida += e.valor_total;
                        })
                      }else{
                        e.itensVenda.forEach((item) => {
                            quantidadeTotal +=item.quantidade;
                    
                            valorTotalVendas += e.valor_total;
                        })
                    
                      }
              
                  } 
                
              });
            });
        setModelo2(repoStck)
        setItem(item)
        setQuantiDivida(quantidadeDivida);
        setModelo(dadosModelo);
        setTotal(quantidadeTotal);
        setTotalDivida(quantidadeTotal2);
        setQuantidadeTotal(valorTotalVendas);
        localStorage.setItem('quantidadeVendas', quantidadeTotal.toString());
        localStorage.setItem('valorTotalVendas', JSON.stringify(valorTotalVendas));
        localStorage.setItem('quantidadeVendasD', quantidadeTotal2.toString());
        localStorage.setItem('valorTotalVendasD', JSON.stringify(quantidadeDivida));
      
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        msg.current.Erro("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
   

    carregarDados();
  }, [stockSelecionado,mesSelecionado]);

  const exportarParaExcel = () => {
    const dados = modelo.map((venda) => ({
      ID: venda.idvendas,
      Quantidade: venda.quantidade,
      "Valor Unitário": venda.valor_uni,
      Data: venda.data,
      "Valor Total": venda.valor_total,
      Cliente: venda.cliente.nome,
      "Mercadorias": venda.mercadorias.map((mercadoria) => `${mercadoria.idmercadoria} : ${mercadoria.nome}`).join(", "),
    }));
  
    // Adicionar linha com o total
    dados.push({
      ID: "TOTAL",
      Quantidade: total, // Adiciona o total de quantidades
      "Valor Unitário": "", 
      Data: "",
      "Valor Total": quantidadeTotal, // Adiciona o valor total das vendas
      Cliente: "",
      "Mercadorias": "",
    });
  
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "relatorio_vendas.xlsx");
  };
  
  async function pagar(id,id2){
    await repositorioClient.editar2(id,"Pago")
    await repositorio.editar2(id2,"Pago")

  }
  const permissao = sessionStorage.getItem("cargo");


  const carregarImagem = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = src;
    });
  
  
  const  gerarPDF = async() => {
    const doc = new jsPDF();
    // Criação dos dados
    const vendasFiltradas = modelo.filter((elemento) => {
      const dataVenda = new Date(elemento.data);
      const anoMes = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
    
      return (!mesSelecionado || anoMes === mesSelecionado) &&
             (!stockSelecionado || elemento.mercadorias.some((e) => e.stock.idstock == stockSelecionado));
    });
  
    const tableData = vendasFiltradas.map((venda) => [
      venda.idvendas,
      venda.data,
      venda.cliente.nome,
      venda.itensVenda.map(e => e.quantidade).join(", ") + " kg",
      venda.itensVenda.map(e => e.valor_uni).join(", ") + " Mt",
      venda.valor_total.toLocaleString("pt-PT", { minimumFractionDigits: 3 }) + " Mt",
      venda.mercadorias.map(m => `${m.nome}`).join(", "),
      venda.status_p
    ]);
  
    // Título
    const logo = await carregarImagem("/logo_white-removebg2.png");

  doc.addImage(logo, 'PNG', 90, 10, 30, 15);
    doc.setFontSize(18);

    const pageWidth = doc.internal.pageSize.getWidth();

    // Informações da empresa
    const empresaInfo = `LifeMar 
    Bairro Nove, Distrito de Zavala
    +258 84 2446503
    NUIT: 401 232 125`;
    
    // Ajusta a fonte e tamanho
    doc.setFontSize(10);
    
    // Divide o texto em linhas e centraliza cada uma
    empresaInfo.split('\n').forEach((linha, i) => {
      doc.text(linha, pageWidth / 2, 30 + (i * 5), { align: 'center' });
    });
    
    // Título do relatório (com mais destaque)
    doc.setFontSize(14);
    doc.text(`Relatório de Vendas - Facturas- ${mesSelecionado} `, pageWidth / 2, 50, { align: 'center' });
    doc.setTextColor(100);
  
    // Tabela com autoTable
    autoTable(doc, {
      startY: 60,
      head: [["Factura Nº", "Data", "Cliente", "Quant.", "Preço Unit.", "Total", "Mercadorias", "Status"]],
      body: tableData,
      styles: { fontSize: 9 }
    });
  
    doc.save("facturas_vendas.pdf");
  };

  function imprimirFatura(id,cliente,data,mercadoria,quantidade,status_p){
    const faturaWindow = window.open("", "_blank");
    // body {
          //   width: 58mm;
          //   font-family: monospace;
          //   font-size: 10px;
          //   padding: 0;
          //   margin: 0;
          // }
  const logoBase64=`/logo_white-removebg2.png`
  faturaWindow.document.write(`
    <html>
      <head>
        <title>Recibo</title>
        <style>
       
          .container {
            padding: 5px;
            width: 100%;
            text-align: center;
          }
          .linha {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .tabela {
            width: 100%;
            text-align: left;
          }
          .tabela td {
            padding: 2px 0;
          }
          .right {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="" alt="LifeMAr Logo" width="80px" />
          <h3>LifeMar</h3>
          <p>Bairo Nove, Distrito de Zavala</p>
           <p>+258 84 2446503</p>
           <p>NUIT: 401 232 125</p>
          <div class="linha"></div>
          <p><strong>Factura Nº: </strong>${id}</p>
          <p><strong>Cliente:</strong> ${cliente}</p>
          <p><strong>Data:</strong> ${data}</p>
          <div class="linha"></div>
          <table class="tabela">
            ${mercadoria.map((id, index) => {
              const nome = mercadoria ? id.nome : `#${id}`;
              const qtd = Number(quantidade.map(e=>e.quantidade)?.[index] || 0);
              const valor = Number(quantidade.map(e=>e.valor_uni)?.[index] || 0);
              const total = qtd * valor;

              return `
                <tr>
                  <td colspan="2">${nome}</td>
                </tr>
                <tr>
                  <td>${qtd} x ${valor.toFixed(2)}</td>
                  <td class="right">${total.toFixed(2)} MZN</td>
                </tr>
              `;
            }).join("")}
          </table>
          <div class="linha"></div>
          <p class="right"><strong>IVA ISENTO   Total: ${
            mercadoria.reduce((soma, _, i) => {
              const qtd = Number(quantidade.map(e=>e.quantidade)?.[i] || 0);
              const valor = Number(quantidade.map(e=>e.valor_uni)?.[i] || 0);
              return soma + (qtd * valor);
            }, 0).toFixed(2)
          } MZN</strong></p>
          <p><strong>Status:</strong> ${status_p}</p>
          <div class="linha"></div>
          <p>Obrigado pela compra!</p>
        </div>
      </body>
    </html>
  `);

  }
  
 
  
  return (
    <>
      {loading && <Loading />} 
      <Header />
      <Conteinner>
        <Slider />
        <Content>
       
        <Link to="/registarvenda" className="back_link">
        <IoMdArrowRoundBack  className="back"/> 
            Cadastro
        </Link>

        {/* {Filtro} */}
        <label>    Filtrar por Stock:</label>
         <img src=""></img>
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
<button onClick={gerarPDF} className="btn btn-success" style={{ marginBottom: "1rem" }}>
  Imprimir Facturas (PDF)
</button>

          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Data</th>
                  <th>Valor Total</th>
                  <th>Cliente</th>
                  <th>Mercadorias</th>
                  <th>Status</th>
                  <th>Ações</th>
                  <th>Imprimir F</th>
                 {(permissao === "admin" )&&
                            <th>Usuario</th>
                          }
                </tr>
              </thead>
              <tbody>
              {modelo.filter((elemento) =>{
                  const dataVenda = new Date(elemento.data);
                  const anoMes = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
                  
              
                return  ( !mesSelecionado || anoMes === mesSelecionado) &&(!stockSelecionado || elemento.mercadorias.some((e) => e.stock.idstock == stockSelecionado))
                })
                .map((elemento, i) => {
                   let estado=""
                   if(elemento.status_p==="Pago"){
                    estado="bg-success p-2"
                  }
                  if(elemento.status_p==="Em_Divida"){
                    estado="bg-danger p-2"
                  }
                  if(elemento.status_p==="Pendente"){
                    estado="bg-warning p-2"
                  }
                  // console.log(elemento)
               
                        return (
                  
                            <tr key={i}>
                              <td>{elemento.idvendas}</td>
                              <td>{elemento.itensVenda.map(e=><p key={e.id}>{e.quantidade}</p>)} </td>
                              <td>{elemento.itensVenda.map(e=><p key={e.id}>{e.valor_uni}</p>)} Mt</td>
                              <td>{elemento.data}</td>
                              <td>
                                {elemento.valor_total.toLocaleString("pt-PT", {
                                  minimumFractionDigits: 3,
                                })} Mt
                              </td>
                              <td>{elemento.cliente.nome}</td>
                              <td>
                                {elemento.mercadorias.map((mercadoria) => `${mercadoria.idmercadoria} : ${mercadoria.nome}`).join(", ")}
                              </td>
                              <td><span className={estado}>{elemento.status_p}</span></td>
                              <>
                                    <td>
                                      {elemento.status_p === "Em_Divida" && (
                                        <button className="btn bg-success" onClick={() => handlePagarClick(elemento)}>Pagar</button>
                                      )}
                                    </td>

                                    {modalOpen && (
                                      <div className="modal">
                                        <div className="modal-content">
                                        <p>{mensagem}</p>
                                        <div class="buttons">
                                        <button className=" sim" onClick={confirmarPagamento}>Sim</button>
                                        <button className=" nao" onClick={() => setModalOpen(false)}>Não</button>
                                        </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                  <button className="btn btn-primary" onClick={()=>{imprimirFatura(elemento.idvendas,elemento.cliente.nome,elemento.data,elemento.mercadorias,elemento.itensVenda,elemento.status_p)}}>Imprimir</button>
                                  {(permissao === "admin" )&&
                                  <td>{elemento.usuario!=null?elemento.usuario.login:0}</td>
                               
                                  }
                            </tr>
                           
                           
                     ) })}
                    </tbody>
                    <tfoot>
                    <tr>
                      <td colSpan="4">Total Pago</td>
                      <td  >{total.toFixed(2)}</td>
                      <td>{quantidadeTotal.toLocaleString("pt-PT", { minimumFractionDigits: 3 })} Mt</td>
                    </tr>
                    <tr>
                      <td colSpan="4">Em dívida</td>
                      <td>{totalDivida.toFixed(2)}</td>
                      <td>{quantiDivida.toLocaleString("pt-PT", { minimumFractionDigits: 3 })} Mt</td>
                    </tr>

                    </tfoot>
                  
            </table>
            {(permissao === "admin" || permissao === "gerente") && (
              <div className="crud">
                <button className="editar" onClick={() => {
                  if (id) {
                    moda.current.Abrir("Deseja editar o " + id);
                    document.querySelector(".sim").addEventListener("click", () => navigate(`/registar-venda/${id}`));
                    document.querySelector(".nao").addEventListener("click", () => moda.current.fechar());
                  } else {
                    msg.current.Erro("Por favor, digite um ID válido!");
                  }
                }}>
                  Editar
                </button>
                <input type="number" className="crudid" placeholder="Digite o ID" value={id} onChange={(e) => setId(e.target.value)} />
                <button onClick={() => {
                  if (id) {
                    moda.current.Abrir("Deseja apagar o " + id);
                    document.querySelector(".sim").addEventListener("click", () => {
                      repositorio.deletar(id);
                      moda.current.fechar();
                    });
                    document.querySelector(".nao").addEventListener("click", () => moda.current.fechar());
                  } else {
                    msg.current.Erro("Por favor, digite um ID válido!");
                  }
                }} className="apagar">
                  Apagar
                </button>
              </div>
            )}
            {permissao === "admin" && (
              <button onClick={exportarParaExcel} className="btn-export mt-3">
                Exportar Relatório Excel
              </button>
            )}
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
