import { Transaction } from "./transactionType"

export interface DayBlockAPIResponse {
    height: number,
    hash: string,
    time: number
}

export interface DayEnergy {
    date: Date,
    energy: number | null,
    transactions: Transaction[] | null,
    errors: null | Array<any>
}