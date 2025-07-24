import { BYTE_TO_KWH } from '../constants'
import { Transaction, TransactionAPIRespnse } from '../types/transactionType'

//given a transaction API response, return its energy
function calcTransactionEnergy(t: TransactionAPIRespnse) : Transaction{
    return {hash: t.hash, energy: t.size * BYTE_TO_KWH, size: t.size}
}

//given a list of transactions, return the total energy
function totalTransactionsListEnergy(transactions: Transaction[]|null){
    if (transactions == null)
        return 0
    return transactions.reduce<number>((prevEnergy, t)=>{
        return prevEnergy + t.energy
    },0)
}

export {calcTransactionEnergy , totalTransactionsListEnergy}