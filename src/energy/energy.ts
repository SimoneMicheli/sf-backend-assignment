import blockchainAPI , {loaders} from "../blockchain/blockchainAPI"
import { loadTransactionsBlockFromCache, saveTransactionsBlockToCache } from "../cache"
import { DayEnergy } from "../types/dayType"
import { Transaction } from "../types/transactionType"
import { calcTransactionEnergy, totalTransactionsListEnergy } from "./energyUtils"
import {addDays, endOfToday} from 'date-fns'
import { GraphQLError } from "graphql"

const energyProcessor = {

    getTransactionsPerBlock: async (blockId:string) =>{

        const transactions = await loaders.transactionsPerBlockLoader.load(blockId)

        if (transactions instanceof Error)
            throw new GraphQLError("Error while fetching data from blockchain API")
        return transactions

    },

    getDayConsumption: async (day: Date) : Promise<DayEnergy> => {
        let dayEnergy = 0
        let dayTransactions : Array<Transaction> = []
        let dayErrors : null | Array<any> = null
  
        const blocks = await loaders.dayBlocksLoader.load(day)

        const transactionsPerBlocks = await loaders.transactionsPerBlockLoader.loadMany(blocks.map(b=>b.hash))        

        // there are a list of blocks per day, every block contains a list of transactions
        for(let transactions of transactionsPerBlocks){
                
            if(transactions instanceof Error){
                dayErrors = dayErrors == null ? [transactions] : [...dayErrors, transactions]
                continue
            }

            // sum up the energy consumed by every transaction in a block
            dayEnergy += totalTransactionsListEnergy(transactions)
                
            // include the transactions of this block in the day transactions
            dayTransactions = dayTransactions.concat(transactions)
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