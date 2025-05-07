export default class vendas{

    constructor(quantidade,valor_uni,data,clientes_idclientes,mercadorias_idmercadorias,status,usuarios) {
        this.quantidade = quantidade;
        this.valor_uni = valor_uni;
        this.data = data;
        this.cliente = {
            idclientes : clientes_idclientes
        };
        this.mercadoria= [
            {
                idmercadoria:mercadorias_idmercadorias
            }
        ];
        this.status_p=status;
        this.usuario = {
            idusuarios:usuarios
        };
        
    }
}