import axios, { AxiosError } from "axios"
import { BlockAPIResponse } from "../types/blockType"
import { Transaction } from "../types/transactionType"
import { GraphQLError } from "graphql"
import redis from "../cache"
import { calcTransactionEnergy, totalTransactionsListEnergy } from "../utils/energyUtils"
import {getTime} from 'date-fns'
import { DayBlockAPIResponse } from "../types/dayType"


async function fetchBlock(blockId: string){
        const url = `https://blockchain.info/rawblock/${blockId}`
        const {data} = await axios.get<BlockAPIResponse>(url)

        const transactions = data.tx.map(calcTransactionEnergy)

        return transactions
    }

async function fetchDayBlocks(day: Date){
    const millis = getTime(day)
    const url = `https://blockchain.info/blocks/${millis}?format=json`

    const response = await axios.get<DayBlockAPIResponse[]>(url)
    return response.data
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

    },

    getDayConsumption: async (day: Date) => {
        let dayEnergy = 0
        let dayTransactions : Array<Transaction> = []

        try {
            
            const blocks = await fetchDayBlocks(day)

            const pendingBlocks = blocks.map(block => blockchainAdapter.getTransactionsPerBlock(block.hash))

            const transactionsPerBlocks = await Promise.all(pendingBlocks)

            // there are a list of blocks per day, every block contains a list of transactions
            for(let transactions of transactionsPerBlocks){
                // sum up the energy consumed by every transaction in a block
                dayEnergy += totalTransactionsListEnergy(transactions)
                
                // include the transactions of this block in the day transactions
                dayTransactions = [...dayTransactions, ...transactions]
            }

            return {
                date: day,
                energy: dayEnergy,
                transactions: dayTransactions
            }
                    
        }
        catch{

            return {
                date: day,
                energy: null,
                transactions: null
            }
        }
    }
}

export default blockchainAdapter