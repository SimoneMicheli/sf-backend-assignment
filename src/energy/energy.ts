import blockchainAPI from "../blockchain/blockchainAPI"
import { loadTransactionsBlockFromCache, saveTransactionsBlockToCache } from "../cache"
import { DayEnergy } from "../types/dayType"
import { Transaction } from "../types/transactionType"
import { calcTransactionEnergy, totalTransactionsListEnergy } from "./energyUtils"
import {addDays, endOfToday} from 'date-fns'
import { GraphQLError } from "graphql"

type BlockInfo = {
    index: number,
    blockId: string,
    transactions: Transaction[] | null,
    error: null | any
}

//given a blockid list, return for each block the list of transactions
const getTransactionsPerBlocks = async (blockIds: Array<string>) => {

    //check if the block exists in the cache
    const cacheBlocks = await Promise.allSettled(blockIds.map(b => loadTransactionsBlockFromCache(b)))

    const blocks = cacheBlocks.map<BlockInfo>((transactions, i)=>{
        if (transactions.status == 'fulfilled' && transactions.value != null){
            return {
                blockId: blockIds[i],
                index: i,
                transactions: transactions.value,
                error: null
            }
        }else{
            return {
                blockId: blockIds[i],
                index: i,
                transactions: null,
                error: null
            }
        }
    })

    const blocksToFetch = blocks.filter(b=>b.transactions == null)

    // fetch data from API in parallel
    const fetchedBlocks = await Promise.allSettled(blocksToFetch.map(block=>blockchainAPI.fetchBlock(block.blockId)))

    fetchedBlocks.forEach((fetchResult,i)=>{
        if(fetchResult.status == 'fulfilled'){
            const t = blockchainAPI.getTransactionsFromDataBlock(fetchResult.value)
            
            //save fetch transactions to cache
            saveTransactionsBlockToCache(blocksToFetch[i].blockId,t)
            // store the received transactions to the original block
            blocks[blocksToFetch[i].index].transactions = t
            
        }
        else{
            blocks[blocksToFetch[i].index].error = fetchResult.reason
        }
    })

    return blocks
}


const energyProcessor = {

    getTransactionsPerBlock: async (blockId:string) =>{

        const block = (await getTransactionsPerBlocks([blockId]))[0]

        if (block.error)
            throw new GraphQLError("Error while fetching data from blockchain API")
        return block.transactions

    },

    getDayConsumption: async (day: Date) : Promise<DayEnergy> => {
        let dayEnergy = 0
        let dayTransactions : Array<Transaction> = []
        let dayErrors : null | Array<any> = null
  
        const blocks = await blockchainAPI.fetchDayBlocks(day)

        const transactionsPerBlocks = await getTransactionsPerBlocks(blocks.map(b=>b.hash))

        // there are a list of blocks per day, every block contains a list of transactions
        for(let block of transactionsPerBlocks){
                
                if(block.error != null)
                    dayErrors = dayErrors == null ? [block.error] : [...dayErrors, block.error]

                // sum up the energy consumed by every transaction in a block
                dayEnergy += totalTransactionsListEnergy(block.transactions)
                
                // include the transactions of this block in the day transactions
                dayTransactions = dayTransactions.concat(block.transactions!)
            }

            return {
                date: day,
                energy: dayEnergy,
                transactions: dayTransactions,
                errors: dayErrors
            }        
        
    },

    getMultipleDaysConsumption: async (days: number)=>{
        let daysEnergy : Array<DayEnergy> = []
        
        for(let day=0; day<days; day++){
        
            const date = addDays(endOfToday(), -day)
        
            const dayConsumption = await energyProcessor.getDayConsumption(date)
        
            daysEnergy = daysEnergy.concat(dayConsumption)
        
        }
        
        return daysEnergy
    },

    getTransactionsPerWallet: async (address: string)=>{
        
        try{
            const response = await blockchainAPI.fetchWallet(address)
            return response.data.txs.map(calcTransactionEnergy)
        }catch{
            throw new GraphQLError(`Unable to get data for wallet ${address}`)
        }
    }
}

export default energyProcessor