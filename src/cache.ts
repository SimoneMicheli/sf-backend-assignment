import {Redis} from 'ioredis'
import { Transaction } from './types/transactionType'

// Create a Redis instance.
// By default, it will connect to localhost:6379
const redis = new Redis()

redis.on("connect",()=>{
    console.log("Connected to redis")
})

redis.on("error",(error)=>{
    console.error(error)
})

const getBlockKey = (blockId:string)=>(`blk:${blockId}`)

export function loadTransactionsBlockFromCache(blockId: string): Promise<Transaction[]|null> {
    return redis.get(getBlockKey(blockId)).then(tjson=>{
        if (tjson)
            return JSON.parse(tjson)
        else
            return null
    })
}

export async function saveTransactionsBlockToCache(blockId: string, transactions: Transaction[]){
    redis.set(getBlockKey(blockId),JSON.stringify(transactions),"EX",300)
}

export default redis