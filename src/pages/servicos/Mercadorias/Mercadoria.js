export  default class Mercadoria{


    constructor(nome,tipo,quantidade,data_entrada,valor_un,data_saida,idusuarios,stocks){
        this.nome = nome;
        this.tipo=tipo;
        this.quantidade=quantidade;
        this.data_entrada=data_entrada;
        this.valor_un=valor_un;
        this.data_saida=data_saida;
        // this.usuario={
        //     idusuarios:idusuarios
        // }
        this.stock={
            idstock:stocks}
            ;

    }

     
    
}