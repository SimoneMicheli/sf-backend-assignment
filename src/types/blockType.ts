import { Transaction, TransactionAPIRespnse } from "./transactionType";

export interface BlockAPIResponse {
    hash: string,
    tx: Array<TransactionAPIRespnse>
}
export interface BlockInfo {
    index: number,
    blockId: string,
    transactions: Transaction[] | null | Error,
}