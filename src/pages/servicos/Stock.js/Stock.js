export default class stock{

    constructor(quantidade,tipo,usuarios,mercadorias_idmercadorias) {
        this.quantidade = quantidade;
 
         this.tipo=tipo;
        this.usuario = {
            idusuarios : usuarios
        };
        this.mercadoria= [
            {
                idmercadoria:mercadorias_idmercadorias
            }
        ]
        
    }
}