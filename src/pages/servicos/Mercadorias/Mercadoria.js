export  default class Mercadoria{


    constructor(nome,tipo,quantidade,quantidade_est,data_entrada,valor_un,data_saida,idusuarios,stocks){
        this.nome = nome;
        this.tipo=tipo;
        this.quantidade=quantidade;
        this.quantidade_est=quantidade_est;
        this.data_entrada=data_entrada;
        this.valor_un=valor_un;
        this.data_saida=data_saida;
        this.usuario={
            idusuarios:idusuarios
        }
        this.stock={
            idstock:stocks}
            ;

    }

     
    
}