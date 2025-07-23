export interface Transaction {
    hash: string,
    size: number,
    energy: number
}

export type TransactionAPIRespnse = Omit<Transaction,'energy'>

