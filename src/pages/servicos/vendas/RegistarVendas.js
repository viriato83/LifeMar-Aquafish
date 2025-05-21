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
 import Select from "react-select";

import { repositorioVenda } from "./vendasRepositorio";
import vendas from "./Vendas";
import repositorioMercadoria from "../Mercadorias/Repositorio";
import ClienteRepository from "../Clientes/ClienteRepository";
import mercadoria from "../Mercadorias/Mercadoria";
export default function RegistarVenda() {
  const [inputs, setInputs] = useState({
    quantidade: [],
    valorUnitario: [],
    data: "",
    cliente: "",
    mercadoria: [],
    status_p:"",
  });

  const [clientes, setClientes] = useState([]); // Lista dinâmica de clientes
  const [mercadorias, setMercadorias] = useState([]); // Lista dinâmica de mercadorias
  const usuario= sessionStorage.getItem("idusuarios");
  const [Imprimir,setImprimir]=useState(false)
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
    console.log(inputs.mercadoria+"valor "+inputs.valorUnitario)


    const fetchMercadorias = async () => {
    
      const data = await mercadoriaRepo.leitura(); // Assumindo que listar retorna as mercadorias
      setMercadorias(data);
    };

  
    fetchClientes();
    fetchMercadorias();
 
  }, [inputs.mercadoria,inputs.valorUnitario]);

  //atualizacao 2025

  const criaMercadoria = (quantidades) => {
    // quantidades é um array com mesma ordem que inputs.mercadoria
    const resultados = [];
  
    let estoqueSuficiente = true;
  
    inputs.mercadoria.forEach((idMercadoria, index) => {
      const mercadoriaSelecionada = mercadorias.find(
        (merc) => merc.idmercadoria === idMercadoria
      );
  
      const quantidadeDesejada = Number(quantidades[index]);
  
      if (mercadoriaSelecionada) {
        let total = Number(mercadoriaSelecionada.quantidade) - quantidadeDesejada;
  
        if (total < 0) {
          estoqueSuficiente = false;
        }
  
        total = parseFloat(total.toFixed(2)); // corrigir precisão
  
        resultados.push({
          idmercadoria: idMercadoria,
          novaQuantidade: total,
        });
      }
    });
  
    if (!estoqueSuficiente) return false;
  
    return resultados;
  };
  // array  de itens

  
  const criaVenda = () => {
    const itens = inputs.mercadoria.map((id, index) => {
      const mercadoriaObj = mercadorias.find(m => m.idmercadoria == id);
      const idmercadoria = mercadoriaObj ? mercadoriaObj.idmercadoria : `#${id}`;
      const quantidade = Number(inputs.quantidade?.[index] || 0);
      const valorUnitario = Number(inputs.valorUnitario?.[index] || 0);
    
      return {
        mercadorias: {idmercadoria},
        quantidade,
        valorUnitario
      };
    });
    
    let quantidade= inputs.quantidade.reduce((anterior,element)=>{
            return Number(anterior)+Number(element)
    })
    let idmercadoria;
   idmercadoria = inputs.mercadoria.map(idmercadoria => ({ idmercadoria }))
    return new vendas(
      inputs.data,
      inputs.cliente,
      idmercadoria,
     inputs.status_p,
     usuario,
     itens,
    );
  };

  const limparFormulario = () => {
    setInputs({
      quantidade: [],
      valorUnitario: [],
      data: "",
      cliente: "",
      mercadoria: [],
      status_p:""
    });
  };
// faccturas 
const imprimirFatura = () => {
  let cliente_nome = "";
  clientes.forEach((e) => {
    if (e.idclientes == inputs.cliente) {
      cliente_nome = e.nome;
    }
  });

  const faturaWindow = window.open("", "_blank");
 
  const logoBase64=`/logo_lifemar.png`
  faturaWindow.document.write(`
    <html>
      <head>
        <title>Recibo</title>
        <style>
          body {
            width: 58mm;
            font-family: monospace;
            font-size: 10px;
            padding: 0;
            margin: 0;
          }
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
          <img src="${logoBase64}" width="80px" />
          <h3>Lifemar, Lda</h3>
          <p>E.N.1 - Quissico</p>
          <div class="linha"></div>
          <p><strong>Cliente:</strong> ${cliente_nome}</p>
          <p><strong>Data:</strong> ${inputs.data}</p>
          <div class="linha"></div>
          <table class="tabela">
            ${inputs.mercadoria.map((id, index) => {
              const mercadoria = mercadorias.find(m => m.idmercadoria == id);
              const nome = mercadoria ? mercadoria.nome : `#${id}`;
              const qtd = Number(inputs.quantidade?.[index] || 0);
              const valor = Number(inputs.valorUnitario?.[index] || 0);
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
          <p class="right"><strong>Total: ${
            inputs.mercadoria.reduce((soma, _, i) => {
              const qtd = Number(inputs.quantidade?.[i] || 0);
              const valor = Number(inputs.valorUnitario?.[i] || 0);
              return soma + (qtd * valor);
            }, 0).toFixed(2)
          } MZN</strong></p>
          <p><strong>Status:</strong> ${inputs.status_p}</p>
          <div class="linha"></div>
          <p>Obrigado pela compra!</p>
        </div>
      </body>
    </html>
  `);

  faturaWindow.document.close();
  faturaWindow.onload = () => {
    const logo = faturaWindow.document.getElementById("logo");
    if (logo) {
      logo.onload = () => {
        faturaWindow.print();
      };
    } else {
      // fallback se não houver imagem
      faturaWindow.print();
    }
  };
};

const cadastrar = async () => { 
  if (id) {
    repositorio.editar(id, criaVenda());

    if (inputs.mercadoria.length > 0) {
      let vendaT = await repositorio.buscarVenda(id);

      // Exemplo: calcular novaV para cada mercadoria individualmente
      let quantidade= inputs.quantidade.reduce((anterior,element)=>{
        return Number(anterior)+Number(element)
})
      const novasQuantidades = quantidade - vendaT.quantidade;
    

      const novaMercadoria = criaMercadoria(novasQuantidades);
      await mercadoriaRepo.editar3(inputs.mercadoria, novaMercadoria);
    }

    msg.sucesso("Venda editada com sucesso.");
    limparFormulario();
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    return;
  }

  // Cadastro novo
  if (
    !inputs.quantidade ||
    !inputs.valorUnitario ||
    !inputs.data ||
    !inputs.cliente ||
    !inputs.mercadoria ||
    inputs.mercadoria.length === 0
  ) {
    msg.Erro("Preencha corretamente todos os campos obrigatórios");
    return;
  }

  // Verificar estoque antes do cadastro (inputs.quantidade é um array)
  const novaMercadoria = criaMercadoria(inputs.quantidade);

  if (!novaMercadoria) {
    msg.Erro("Estoque insuficiente.");
    return;
  }

  try {
    if (inputs.cliente !== status) {
      await repositorio.cadastrar(criaVenda());
      console.log(criaVenda())

      // Atualizar mercadorias - espera arrays para mercadorias e quantidades
      novaMercadoria.forEach((e)=>{
        mercadoriaRepo.editar3(e.idmercadoria, e.novaQuantidade);
        // console.log(e.idmercadoria, e.novaQuantidade)
      })
      // await mercadoriaRepo.editar3(inputs.mercadoria, novaMercadoria);
      console.log("Mercadorias selecionadas:", inputs.mercadoria);
      console.log("Novas quantidades:", novaMercadoria);

      // Atualizar status do cliente, se necessário
      if (inputs.status_p) {
        await clienteRepo.editar2(inputs.cliente, inputs.status_p);
      }

      // Atualizar saídas para cada mercadoria individualmente
      inputs.mercadoria.forEach((idMercadoria, i) => {
        const mercadoriaOriginal = mercadorias.find(
          (m) => m.idmercadoria === idMercadoria
        );

        if (mercadoriaOriginal) {
          const novaSaida =
            Number(mercadoriaOriginal.q_saidas || 0) +
            Number(inputs.quantidade[i]);
          mercadoriaRepo.editar2(idMercadoria, inputs.data, novaSaida);
           console.log("saidas"+idMercadoria, inputs.data, novaSaida)
        }
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      setImprimir(true);
    } else {
      msg.Erro("O cliente contém dívida");
    }
  } catch (error) {
    msg.Erro("Erro ao cadastrar venda.");
    console.log(error)
  }
};

  
  const agruparMercadorias = () => {
    const grupos = mercadorias.reduce((acc, merc) => {
      const grupo = `Stock ${merc.stock?.idstock} - ${merc.stock?.tipo}`;
      if (!acc[grupo]) acc[grupo] = [];
      if (merc.quantidade !== 0) {
        acc[grupo].push({
          value: merc.idmercadoria,
          label: `${merc.nome} :: ${merc.quantidade} Kg`
        });
      }
      return acc;
    }, {});
  
    return Object.entries(grupos).map(([label, options]) => ({
      label,
      options
    }));
  };

  return (
    <>
      <Header />
      <Conteinner>
        <Slider />
        <Content>
      
             {Imprimir?(
              <div className="mensagem2 alert alert-success alert-dismissible z-3">Venda cadastrada com sucesso. 
                
                <button onClick={()=>{imprimirFatura();
                      setImprimir(false)
                      limparFormulario();

                    }
                      
                    } 
                      className="btn btn-primary">Imprimir Factura   
                </button> <button type="button" className="btn-close" onClick={limparFormulario} data-bs-dismiss="alert" aria-label="Close" ></button>
              </div>):""}
           
          <div className="Cadastro">
        
              
            <h1>Registo de Vendas</h1>
            <br />
            <div className="form">
            <label>ID:</label>
              <input type="number" value={id ? id : 0} disabled className="id" />
             

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

<Select
  isMulti
  name="mercadoria"
  options={agruparMercadorias()}
  className="basic-multi-select"
  classNamePrefix="select"
  placeholder="Selecione as mercadorias"
  value={agruparMercadorias()
    .flatMap(g => g.options)
    .filter(opt => inputs.mercadoria.includes(opt.value))
  }
  onChange={(selectedOptions) =>
    setInputs({
      ...inputs,
      mercadoria: selectedOptions.map((option) => option.value)
    })
  }
/>


              <br />
        
  <div>
    {inputs.mercadoria.map((id, index) => {
      const mercadoriaSelecionada = mercadorias.find(
        (m) => m.idmercadoria == id
      );

      return (
        <div key={id} style={{ marginBottom: "10px" }}>
          <span>{mercadoriaSelecionada?.nome || "Mercadoria"}:</span>
          
          {/* Campo para Quantidade */}
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Quantidade em kg"
            className="quantidade"
            value={inputs.quantidade?.[index] || ""}
            onChange={(e) => {
              const novaQuantidade = [...(inputs.quantidade || [])];
              novaQuantidade[index] = e.target.value;
              setInputs({ ...inputs, quantidade: novaQuantidade });
            }}
          />

          {/* Campo para Valor Unitário */}
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor unitário"
            className="valorUnitario"
            value={inputs.valorUnitario?.[index] || ""}
            onChange={(e) => {
              const novoValorUnitario = [...(inputs.valorUnitario || [])];
              novoValorUnitario[index] = e.target.value;
              setInputs({ ...inputs, valorUnitario: novoValorUnitario });
            }}
          />
        </div>
      );
    })}
  </div>

              
            </div>
            <button onClick={(e)=>{e.preventDefault(); cadastrar()}} className="cadastrarVenda">
              Cadastrar
            </button>
          </div>
        </Content>
      </Conteinner>
      <Footer />
    </>
  );
}
