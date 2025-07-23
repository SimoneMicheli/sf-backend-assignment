import axios, { AxiosError } from "axios"
import { BlockAPIResponse } from "../types/blockType"
import { Transaction } from "../types/transactionType"
import { GraphQLError } from "graphql"
import redis from "../cache"
import { calcTransactionEnergy } from "../utils/energyUtils"


async function fetchBlock(blockId: string){
        const url = `https://blockchain.info/rawblock/${blockId}`
        const {data} = await axios.get<BlockAPIResponse>(url)

        const transactions = data.tx.map(calcTransactionEnergy)

        return transactions
    }

const getBlockKey = (blockId:string)=>(`blk:${blockId}`)

const blockchainAdapter = {

    getTransactionsPerBlock: async (blockId:string): Promise<Transaction[]> =>{
        //try to load block transactions from cache
        try{
            const tjson = await redis.get(getBlockKey(blockId))
            if (tjson){
                const transactions = JSON.parse(tjson) 
                return transactions
            }

        }catch (error) {
            console.info(`Cache miss for block id: ${blockId}`)
        }

        //if not found in the cache load from API
        try{
            const transactions = fetchBlock(blockId)
            redis.set(getBlockKey(blockId),JSON.stringify(transactions),"EX",300)
            return transactions
        }catch (error){
            const err = error as AxiosError
            console.error(error, `Unable to fetch block id: ${blockId}`)
            throw new GraphQLError(`Unable to fetch block id: ${blockId}`)
        }

    }
}

export default blockchainAdapter