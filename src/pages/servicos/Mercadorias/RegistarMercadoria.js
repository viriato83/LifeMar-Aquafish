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
  const usuario= localStorage.getItem("idusuarios");

  useEffect(() => {
    // msg =;

    
    // Buscar estoques do backend
    const fetchEstoques = async () => {
      const estoqueRepo = new repositorioStock();
      const data = await estoqueRepo.leitura(); // Assumindo que `listar` retorna os estoques
      setEstoques(data);
    };

    fetchEstoques();
    console.log(criaMercadoria())
    console.log(inputs.estoque)
  }, []);

  const criaMercadoria = () => {
    return new Mercadoria(inputs.nome,inputs.tipo,inputs.quantidade,inputs.quantidade,inputs.dataEntrada,inputs.valorUnitario,inputs.dataSaida,usuario,inputs.estoque) 
      
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
  

  const cadastrar = () => {
    if (id) {
      repositorio.editar(id, criaMercadoria());
      msg.sucesso("Mercadoria editada com sucesso.");
      limparFormulario(); // Limpa o formulário após editar
    } else {
      if (
        !inputs.nome ||
        !inputs.tipo ||
        !inputs.quantidade ||
        !inputs.dataEntrada ||
        !inputs.valorUnitario ||
        !inputs.estoque
      ) {
        msg.Erro("Preencha corretamente todos os campos obrigatórios");
      } else {
        repositorio.cadastrar(criaMercadoria());
        localStorage.setItem("quantidade",JSON.stringify(quantidade))
        msg.sucesso("Mercadoria cadastrada com sucesso.");
        limparFormulario(); // Limpa o formulário após cadastrar
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
              <br />
              <label>Tipo:</label>
              <input
                type="text"
                className="tipo"
                placeholder="Saída ou Entrada"
                value={inputs.tipo}
                onChange={(e) => setInputs({ ...inputs, tipo: e.target.value })}
              />
              <br />
              <label>Quantidade: kg</label>
              <input
                type="number"
                className="quantidade"
                placeholder="Quantidade kg"
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
              <br />
              <label>Data de Saída: --Opcional</label>
              <input
                type="date"
                className="dataSaida"
                
                onChange={(e) =>
                  setInputs({ ...inputs, dataSaida: e.target.value })
                }
              />
              <br />
              <label>Estoque:</label>
              <select
                className="estoque"
                onChange={(e) =>
                  setInputs({ ...inputs, estoque: e.target.value })
                }
              >
                <option value="">Selecione um estoque
                
                </option>
                {estoques.map((estoque) => (
                  <option key={estoque.idstock} value={estoque.idstock} >
                   {estoque.idstock}. {estoque.tipo}
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
