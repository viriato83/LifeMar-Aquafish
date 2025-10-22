import { useEffect, useState } from "react";
import Conteinner from "../../../components/Conteinner";
import Content from "../../../components/Content";
import Header from "../../../components/Header";
import Slider from "../../../components/Slider";
import Footer from "../../../components/Footer";
import { useParams } from "react-router-dom";
import mensagem from "../../../components/mensagem";

import repositorioStock from "../Stock.js/Repositorio";
import Mercadoria from "./Mercadoria";
import repositorioMercadoria from "./Repositorio";
import stock from "../Stock.js/Stock";


export default function RegistarMercadoria() {
  const [inputs, setInputs] = useState({
    nome: "",
    tipo: "",
    quantidade: "",
    dataEntrada: "",
    valorUnitario: "",
    dataSaida: "",
    estoque: "",
  });
  const quantidade=inputs.quantidade
  const [estoques, setEstoques] = useState([]); // Lista dinâmica de estoques
  const { id } = useParams();
  let msg= new mensagem();
  let repositorio = new repositorioMercadoria();
  const usuario= sessionStorage.getItem("idusuarios");
  const estoqueRepo = new repositorioStock();
  useEffect(() => {
    // msg =;
  
    
    // Buscar estoques do backend
    const fetchEstoques = async () => {
   
      const data = await estoqueRepo.leitura(); // Assumindo que `listar` retorna os estoques
      setEstoques(data);
    };

    fetchEstoques();
   
  }, []);
  function calculaQuantidadeStock() {
    let stock = estoques.find((e) => e.idstock == inputs.estoque);
    if (stock) {
      return stock.quantidade-Number(inputs.quantidade)
    }
    else{
      console.log("stock nao encotrado")
    }
  }
  
  const criaMercadoria = () => {
    return new Mercadoria(inputs.nome,"Entrada",inputs.quantidade,inputs.quantidade,inputs.dataEntrada,inputs.valorUnitario,inputs.dataSaida,usuario,inputs.estoque) 
      
  };
  const limparFormulario = () => {
    setInputs({
      nome: "",
      tipo: "",
      quantidade: "",
      dataEntrada: "",
      valorUnitario: "",
      dataSaida: "",
      estoque: "",
    });
  };


  const cadastrar =  async() => {
    if (id) {
      repositorio.editar(id, criaMercadoria());
      msg.sucesso("Mercadoria editada com sucesso.");
      limparFormulario(); // Limpa o formulário após editar
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      if (
        !inputs.nome ||
    
        !inputs.quantidade ||
        !inputs.dataEntrada ||
        !inputs.valorUnitario ||
        !inputs.estoque
      ) {
        msg.Erro("Preencha corretamente todos os campos obrigatórios");
      } else {
             if(calculaQuantidadeStock()>0){
              await repositorio.cadastrar(criaMercadoria());
              await  estoqueRepo.editar(inputs.estoque,new stock(0,calculaQuantidadeStock(),"","","",0))
              localStorage.setItem("quantidade",JSON.stringify(quantidade))
              msg.sucesso("Mercadoria cadastrada com sucesso.");
              limparFormulario(); // Limpa o formulário após cadastrar
              setTimeout(() => {
                window.location.reload();
              }, 2000);
             }
             else{
              msg.Erro("Stock Insuficiente")
             }
      }
    }
  };
  
  

  return (
    <>
      <Header />
      <Conteinner>
        <Slider />
        <Content>
          <div className="Cadastro">
            <h1>Registo  de Mercadorias</h1>
            <br />
            <div className="form">
              <label>ID:</label>
              <input type="number" value={id ? id : 0} disabled className="id" />
              <br />
              <label>Nome:</label>
              <input
                type="text"
                className="nome"
                placeholder="Nome da mercadoria"
                value={inputs.nome}
             
                onChange={(e) => setInputs({ ...inputs, nome: e.target.value })}
              />
              {/* <br />
              <label>Tipo:</label>
              <input
                type="text"
                className="tipo"
                placeholder="Saída ou Entrada"
                value={inputs.tipo}
                onChange={(e) => setInputs({ ...inputs, tipo: e.target.value })}
              /> */}
              <br />
              <label>Quantidade</label>
              <input
                type="number"
                className="quantidade"
                placeholder="Quantidade Unitaria"
                value={inputs.quantidade==null?null:inputs.quantidade}
                onChange={(e) =>
                  setInputs({ ...inputs, quantidade: e.target.value })
                }
              />
              <br />
              <label>Data de Entrada:</label>
              <input
                type="date"
                className="dataEntrada"
                value={inputs.dataEntrada}
                onChange={(e) =>
                  setInputs({ ...inputs, dataEntrada: e.target.value })
                }
              />
              <br />
              <label>Valor Unitário:</label>
              <input
                type="number"
                className="valorUnitario"
                placeholder="Valor unitário"
                value={inputs.valorUnitario}
                onChange={(e) =>
                  setInputs({ ...inputs, valorUnitario: e.target.value })
                }
              />
              {/* <br />
              <label>Data de Saída: --Opcional</label>
              <input
                type="date"
                className="dataSaida"
                
                onChange={(e) =>
                  setInputs({ ...inputs, dataSaida: e.target.value })
                }
              /> */}
              <br />
              <label>Stock:</label>
              <select
                className="estoque"
                onChange={(e) =>
                  setInputs({ ...inputs, estoque: e.target.value })
                }
              >
                <option value="">Selecione um Stock
                
                </option>
                {estoques.map((estoque) => (
                  <option key={estoque.idstock} value={estoque.idstock} >
                   {estoque.idstock}. {estoque.tipo} :: {estoque.quantidade}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={cadastrar} className="cadastrarMercadoria">
              Cadastrar
            </button>
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
