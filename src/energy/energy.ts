import blockchainAPI from "../blockchain/blockchainAPI"
import { loadTransactionsBlockFromCache, saveTransactionsBlockToCache } from "../cache"
import { DayEnergy } from "../types/dayType"
import { Transaction } from "../types/transactionType"
import { calcTransactionEnergy, totalTransactionsListEnergy } from "./energyUtils"
import {addDays, endOfToday} from 'date-fns'

//given a blockid list, return for each block the list of transactions
const getTransactionsPerBlocks = async (blockIds: Array<string>) => {

    //check if the block exists in the cache
    const blocks = await Promise.all(blockIds.map(async (blockId, i)=>{
        const blockTransactions = await loadTransactionsBlockFromCache(blockId)
        if (blockTransactions){
            return {
                blockId: blockId,
                index: i,
                transactions: blockTransactions
            }
        }else{
            return {
                blockId: blockId,
                index: i,
                transactions: null
            }
        }
    }))

    const blocksToFetch = blocks.filter(b=>b.transactions == null)

    // fetch data from API in parallel
    const fetchedBlocks = await Promise.all(blocksToFetch.map(block=>blockchainAPI.fetchBlock(block.blockId)))
    const fetchedTransactions = fetchedBlocks.map(b=>blockchainAPI.getTransactionsFromDataBlock(b))

        
    fetchedTransactions.forEach((t,i)=>{
        if(t!==null){
            //save fetch transactions to cache
            saveTransactionsBlockToCache(blocksToFetch[i].blockId,t)
            // store the received transactions to the original block
            blocks[blocksToFetch[i].index].transactions = t
        }
    })
    return blocks
}


const energyProcessor = {

    getTransactionsPerBlock: async (blockId:string) =>{

        return (await getTransactionsPerBlocks([blockId]))[0].transactions

    },

    getDayConsumption: async (day: Date) => {
        let dayEnergy = 0
        let dayTransactions : Array<Transaction> = []

        try {
            
            const blocks = await blockchainAPI.fetchDayBlocks(day)

            const transactionsPerBlocks = await getTransactionsPerBlocks(blocks.map(b=>b.hash))

            // there are a list of blocks per day, every block contains a list of transactions
            for(let block of transactionsPerBlocks){
                // sum up the energy consumed by every transaction in a block
                dayEnergy += totalTransactionsListEnergy(block.transactions)
                
                // include the transactions of this block in the day transactions
                if(block.transactions != null)
                    dayTransactions = dayTransactions.concat(block.transactions)
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
        
        const response = await blockchainAPI.fetchWallet(address)
        return response.data.txs.map(calcTransactionEnergy)
    }
}

export default energyProcessor