import { useEffect, useState } from "react";
import Conteinner from "../../../components/Conteinner";
import Content from "../../../components/Content";
import Header from "../../../components/Header";
import Slider from "../../../components/Slider";
import Footer from "../../../components/Footer";
import { useParams } from "react-router-dom";
import mensagem from "../../../components/mensagem";
import repositorioStock from "../Stock.js/Repositorio";
 // Adicionar repositório de clientes

import { repositorioVenda } from "./vendasRepositorio";
import vendas from "./Vendas";
import repositorioMercadoria from "../Mercadorias/Repositorio";
import ClienteRepository from "../Clientes/ClienteRepository";
import mercadoria from "../Mercadorias/Mercadoria";
export default function RegistarVenda() {
  const [inputs, setInputs] = useState({
    quantidade: "",
    valorUnitario: "",
    data: "",
    cliente: "",
    mercadoria: "",
    status_p:"",
  });

  const [clientes, setClientes] = useState([]); // Lista dinâmica de clientes
  const [mercadorias, setMercadorias] = useState([]); // Lista dinâmica de mercadorias
  const { id } = useParams();
  let msg = new mensagem();
  let repositorio = new repositorioVenda();
  const mercadoriaRepo = new repositorioMercadoria();
  const clienteRepo = new ClienteRepository();
  let Cadastro =true; //
  let saidas=0;
  let [status,setStaus]=useState(0)
  useEffect(() => {
    // atualizacao 2025
    // Buscar clientes e mercadorias do backend
    const fetchClientes = async () => {
      const clienteRepo = new ClienteRepository();
      const data = await clienteRepo.leitura(); // Assumindo que listar retorna os clientes
      setClientes(data);
      data.forEach((e)=>{
          if(e.status_p=="Em_Divida"){
            setStaus(e.idclientes)
          }
      })
    };


    const fetchMercadorias = async () => {
    
      const data = await mercadoriaRepo.leitura(); // Assumindo que listar retorna as mercadorias
      setMercadorias(data);
    };

  
    fetchClientes();
    fetchMercadorias();
  }, []);

  //atualizacao 2025

  const criaMercadoria = (quantidade) => {
    let Total = 0;
  
    mercadorias.map((merc) => {
      if (merc.idmercadoria == inputs.mercadoria) {
        Total = Number(merc.quantidade) - Number(quantidade);
  
        if (Total < 0) {
          Cadastro = false;
        } else {
          Cadastro = true;
        }
  
        // Corrigir precisão
        Total = parseFloat(Total.toFixed(2));
      }
    });
  
    return Total;
  };
  
  
  
  const criaVenda = () => {
 
    return new vendas(
      inputs.quantidade,
      inputs.valorUnitario,
      inputs.data,
      inputs.cliente,
      inputs.mercadoria,
      inputs.status_p
    );
  };

  const limparFormulario = () => {
    setInputs({
      quantidade: "",
      valorUnitario: "",
      data: "",
      cliente: "",
      mercadoria: "",
      status_p:""
    });
  };

  const cadastrar = async () => {
    if (id) {
      repositorio.editar(id, criaVenda());
      if(inputs.mercadoria){
        let vendaT= await repositorio.buscarVenda(id);
        let novaV=0;
        if(inputs.quantidade>vendaT.quantidade){
          novaV=vendaT.quantidade-inputs.quantidade
         
        }if(inputs.quantidade<vendaT.quantidade){
          novaV=vendaT.quantidade-inputs.quantidade
        
        }
     
               const novaMercadoria = criaMercadoria(novaV);
               await mercadoriaRepo.editar3(inputs.mercadoria, novaMercadoria);
       }
      msg.sucesso("Venda editada com sucesso.");
      limparFormulario();
    } else {
      if (
        !inputs.quantidade ||
        !inputs.valorUnitario ||
        !inputs.data ||
        !inputs.cliente ||
        !inputs.mercadoria
      ) {
        msg.Erro("Preencha corretamente todos os campos obrigatórios");
        return;
      }
  
      // Verificar estoque antes do cadastro
      const novaMercadoria = criaMercadoria(inputs.quantidade);
  
      if (!Cadastro) {
        msg.Erro("Estoque insuficiente.");
        return;
      }
  
      try {
        // Cadastrar venda
        if(inputs.cliente!=status){
            await repositorio.cadastrar(criaVenda());
      
            // Atualizar mercadoria com estoque atualizado
            console.log(novaMercadoria)
            await mercadoriaRepo.editar3(inputs.mercadoria, novaMercadoria);
            if(inputs.status_p){
              await clienteRepo.editar2(inputs.cliente,inputs.status_p)
            }
            
            // Atualizar saídas
            mercadorias.forEach((merc) => {
              if (merc.idmercadoria == inputs.mercadoria) {
                saidas = merc.q_saidas + Number(inputs.quantidade);
              }
            });
            
            await mercadoriaRepo.editar2(inputs.mercadoria, inputs.data, saidas);
            
            msg.sucesso("Venda cadastrada com sucesso.");
            limparFormulario();
          }else{
            msg.Erro("O cliente Contem Divida")
          }
        limparFormulario()
      } catch (error) {
        msg.Erro(`Erro ao cadastrar venda.`);
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
            <h1>Registo de Vendas</h1>
            <br />
            <div className="form">
            <label>ID:</label>
              <input type="number" value={id ? id : 0} disabled className="id" />
              <br />
              <label>Quantidade: kg</label>
              <input
                type="number"
                className="quantidade"
                placeholder="Quantidade em kg"
                value={inputs.quantidade==null?null:inputs.quantidade}
                onChange={(e) =>
                  setInputs({ ...inputs, quantidade: e.target.value })
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
              <br />
              <label>Data:</label>
              <input
                type="date"
                className="data"
                value={inputs.data}
                onChange={(e) => setInputs({ ...inputs, data: e.target.value })}
              />
              <br />
              <label>Cliente:</label>
              <select
                className="cliente"
                value={inputs.cliente}
                onChange={(e) =>
                  setInputs({ ...inputs, cliente: e.target.value })
                }
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.idclientes} value={cliente.idclientes}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
                <br/>
              <label className="status">Status:</label>
                    <select
                      className="status"
                      value={inputs.status_p}
                      onChange={(e) =>
                        setInputs({ ...inputs, status_p: e.target.value })
                      }
                    >
                      <option value="">Selecione o Estado de pagamento</option>
                      <option key="1s" value="Pago">Pago</option>
                      <option key="2s" value="Em_Divida">Em Dívida</option>
                    </select>
                    
            
           
              <br />
              <label>Mercadoria:</label>
              <select
                className="mercadoria"
                value={inputs.mercadoria}
                onChange={(e) =>
                  setInputs({ ...inputs, mercadoria: e.target.value })
                }
              >
                <option value="">Selecione uma mercadoria</option>
                {mercadorias.map((mercadoria) => (
                  <option
                    key={mercadoria.idmercadoria}
                    value={mercadoria.idmercadoria}
                  >
                    {mercadoria.nome}
                  </option>
                ))}
              </select>
              <br />
            </div>
            <button onClick={cadastrar} className="cadastrarVenda">
              Cadastrar
            </button>
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
