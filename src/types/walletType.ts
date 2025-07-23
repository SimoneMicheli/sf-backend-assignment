import { Transaction, TransactionAPIRespnse } from "./transactionType"

export interface Wallet{
    address: string,
    energy: number,
    transactions: Transaction[]
}

export interface WalletAPIResponse {
    address: string,
    txs: TransactionAPIRespnse[]
}