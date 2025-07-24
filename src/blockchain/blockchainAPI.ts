import axios from "axios"
import { BlockAPIResponse, BlockInfo } from "../types/blockType"
import { calcTransactionEnergy } from "../energy/energyUtils"
import { DayBlockAPIResponse } from "../types/dayType"
import { WalletAPIResponse } from "../types/walletType"
import { getTime} from 'date-fns'
import DataLoader from "dataloader"
import { Transaction } from "../types/transactionType"
import { loadTransactionsBlockFromCache, saveTransactionsBlockToCache } from "../cache"

const blockchainAPI = {
    fetchBlock: (blockId: string) => {
        const url = `https://blockchain.info/rawblock/${blockId}`
        return axios.get<BlockAPIResponse>(url)
    },

    getTransactionsFromDataBlock: (dataBlock: BlockAPIResponse) =>{
        return dataBlock.tx.map(calcTransactionEnergy)
    },

    fetchDayBlocks: async(day: Date) => {
        const millis = getTime(day)
        const url = `https://blockchain.info/blocks/${millis}?format=json`

        const response = await axios.get<DayBlockAPIResponse[]>(url)
        return response.data
    },

    fetchWallet: (address: string) =>{
        const url = `https://blockchain.info/rawaddr/${address}`
        return axios.get<WalletAPIResponse>(url)
    }
}

const loaders = {
    blockLoader : new DataLoader<string,BlockAPIResponse>(async blockIds => {
        // fetch data from API in parallel
        const fetchedBlocks = await Promise.allSettled(blockIds.map(block=>blockchainAPI.fetchBlock(block)))
    
        return fetchedBlocks.map((fetchResult,i)=>{
            if(fetchResult.status == 'fulfilled')
                return fetchResult.value.data
            
            const error = fetchResult.reason
            return new Error(error.status)
        })
    }),

    //given a blockid list, return for each block the list of transactions
    transactionsPerBlockLoader : new DataLoader<string,Transaction[]>( async (blockIds) => {
    
        //check if the block exists in the cache
        const cacheBlocks = await Promise.allSettled(blockIds.map(b => loadTransactionsBlockFromCache(b)))
    
        const blocks = cacheBlocks.map<BlockInfo>((fetchResult, i)=>{
            return {
                blockId: blockIds[i],
                index: i,
                transactions: (fetchResult.status == 'fulfilled' && fetchResult.value != null) ? fetchResult.value : null
            }
        })
    
        const blocksToFetch = blocks.filter(b=>b.transactions == null)
    
        // fetch data from API in parallel
        const fetchedBlocks = await loaders.blockLoader.loadMany(blocksToFetch.map(block=>block.blockId))
    
        fetchedBlocks.forEach((block,i)=>{
            if(block instanceof Error){
                blocks[blocksToFetch[i].index].transactions = block
            }else{
                const t = blockchainAPI.getTransactionsFromDataBlock(block)
                //save fetch transactions to cache
                saveTransactionsBlockToCache(blocksToFetch[i].blockId,t)
                // store the received transactions to the original block
                blocks[blocksToFetch[i].index].transactions = t
            }
        })
    
        return blocks.map(b=>b.transactions!)
    }),

    dayBlocksLoader : new DataLoader<Date,DayBlockAPIResponse[]>(async (days)=>{

        const responses = await Promise.allSettled(days.map(d=>blockchainAPI.fetchDayBlocks(d)))

        return responses.map(r=>{
            if (r.status == 'fulfilled')
                return r.value

            return new Error(r.reason.status)
        })
    })
}

export default blockchainAPI
export {loaders}