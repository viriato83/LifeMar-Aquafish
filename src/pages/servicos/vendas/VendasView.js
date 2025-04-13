import { useEffect, useState, useRef } from "react";
import Header from "../../../components/Header";
import Conteinner from "../../../components/Conteinner";
import Slider from "../../../components/Slider";
import Content from "../../../components/Content";
import { useNavigate } from "react-router-dom";
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
  const [stockSelecionado,setLoteS] = useState(0)
  const [totalDivida, setTotalDivida] = useState(0);
  const [quantiDivida,setQuantiDivida] = useState(0);
 
  useEffect(() => {
    msg.current = new Mensagem();
    moda.current = new Modal();
    
    async function carregarDados() {
      setLoading(true);
      try {
        const dadosModelo = await repositorio.leitura();
        const repositoriomerc = await repositorioMerc.leitura();
        const repoStck = await repoStco.leitura();
        const dadosTotal = await repositorio.total();
        const quantidadeTotalVendas = dadosModelo.reduce((acc, venda) => acc + venda.valor_total, 0);
        var valorTotalVendas = 0
        var quantidadeTotal = 0;
        var quantidadeTotal2 = 0;
        var quantidadeDivida= 0;
         

        dadosModelo.forEach((e) => {
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
        setModelo2(repoStck)
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
  }, [stockSelecionado]);

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
      Quantidade: quantidadeTotal, // Adiciona o total de quantidades
      "Valor Unitário": "", 
      Data: "",
      "Valor Total": total, // Adiciona o valor total das vendas
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

  return (
    <>
      {loading && <Loading />} 
      <Header />
      <Conteinner>
        <Slider />
        <Content>
        <h2 >Vendas</h2>
        
        <label>    Filtrar por Stock:</label>
          <select value={stockSelecionado} onChange={(e) => setLoteS(e.target.value)}>
            {modelo2.map((stock) => (
              <option key={stock.idstock} value={stock.idstock}>
                Stock {stock.tipo}
              </option>
            ))}
          </select>
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
                </tr>
              </thead>
              <tbody>
              {modelo.filter((elemento) =>
                  !stockSelecionado || elemento.mercadorias.some((e) => e.stock.idstock == stockSelecionado)
                )
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
               
                        return (
                  
                            <tr key={i}>
                              <td>{elemento.idvendas}</td>
                              <td>{elemento.quantidade} kg</td>
                              <td>{elemento.valor_uni} Mt</td>
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
                                  <td>{elemento.status_p=="Em_Divida"&&(
                                      <button className="btn bg-success" onClick={()=>{
                                        moda.current.Abrir("Deseja Validar o pagamento do " + elemento.cliente.nome);
                                        document.querySelector(".sim").addEventListener("click", () => {
                                          try{

                                            pagar(elemento.cliente.idclientes,elemento.idvendas)
                                          }catch{
                                            console.log("erro")
                                          }finally{

                                            window.location.reload();
                                          }
                                        });
                                        document.querySelector(".nao").addEventListener("click", () => {
                                          moda.current.fechar();
                                        });
                                      }}>Pagar</button>
                                  )}</td>

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
                      <td>{totalDivida}</td>
                      <td>{quantiDivida.toLocaleString("pt-PT", { minimumFractionDigits: 3 })} Mt</td>
                    </tr>

                    </tfoot>
                  
            </table>
            {(permissao === "admin" || permissao === "funcionario") && (
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
