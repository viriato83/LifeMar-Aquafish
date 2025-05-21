export default class vendas{

    constructor(data,clientes_idclientes,mercadorias_idmercadorias,status,usuarios,itens) {
       
        this.data = data;
        this.cliente = {
            idclientes : clientes_idclientes
        };
        this.mercadoria=mercadorias_idmercadorias
        this.status_p=status;
        this.usuario = {
            idusuarios:usuarios
        };
        this.itens=itens
        
    }
}