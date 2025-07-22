import { Transaction, TransactionAPIRespnse } from "./Transaction"

function calcTransactionEnergy(t: TransactionAPIRespnse) : Transaction{
    return {hash: t.hash, energy: t.size * 4.56, size: t.size}
}

function totalTransactionsListEnergy(transactions: Transaction[]){
    return transactions.reduce<number>((prevEnergy, t)=>{
        return prevEnergy + t.energy
    },0)
}

export {calcTransactionEnergy , totalTransactionsListEnergy}