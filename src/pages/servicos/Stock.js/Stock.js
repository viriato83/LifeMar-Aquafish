export default class stock{

    constructor(quantidade,quantidade_estoque,tipo,usuarios,data,mercadorias_idmercadorias) {
        this.quantidade = quantidade;
        this.quantidade_estoque=quantidade_estoque
        this.data= data;
         this.tipo=tipo;
        this.usuario = {
            idusuarios:usuarios
        };
        this.mercadoria= [
            {
                idmercadoria:mercadorias_idmercadorias
            }
        ]
        
    }
}