import { TransactionAPIRespnse } from "./transaction";

export interface BlockAPIResponse {
    hash: string,
    tx: Array<TransactionAPIRespnse>
}