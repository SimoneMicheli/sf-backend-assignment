import { Transaction, TransactionAPIRespnse } from "../Transaction"

//given a transaction API response, return its energy
function calcTransactionEnergy(t: TransactionAPIRespnse) : Transaction{
    return {hash: t.hash, energy: t.size * 4.56, size: t.size}
}

//given a list of transactions, return the total energy
function totalTransactionsListEnergy(transactions: Transaction[]){
    return transactions.reduce<number>((prevEnergy, t)=>{
        return prevEnergy + t.energy
    },0)
}

export {calcTransactionEnergy , totalTransactionsListEnergy}