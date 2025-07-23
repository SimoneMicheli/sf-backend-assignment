import { TransactionAPIRespnse } from "./transactionType";

export interface BlockAPIResponse {
    hash: string,
    tx: Array<TransactionAPIRespnse>
}