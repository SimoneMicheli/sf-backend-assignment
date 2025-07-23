import { ResolverResolveParams, schemaComposer } from 'graphql-compose'
import { GraphQLError } from 'graphql'
import axios, { AxiosError } from 'axios'
import { calcTransactionEnergy } from './utils/energyUtils'
import redis from './cache'
import { Transaction } from './types/transactionType'
import { BlockAPIResponse } from './types/blockType'

const TransactionTC = schemaComposer.createObjectTC({
    name: 'Transaction',
    fields: {
        hash: 'String!',
        energy: 'Float!'
    },
})

const getBlockKey = (blockId:string)=>(`blk:${blockId}`)

async function getTransactionsPerBlock(blockId:string) : Promise<Transaction[]> {


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
        const url = `https://blockchain.info/rawblock/${blockId}`
        const {data} = await axios.get<BlockAPIResponse>(url)

        const transactions = data.tx.map(calcTransactionEnergy)

        redis.set(getBlockKey(blockId),JSON.stringify(transactions),"EX",300)

        return transactions
        
    }catch (error){
        const err = error as AxiosError
        console.error(error, `Unable to fetch block id: ${blockId}`)
        throw new GraphQLError(`Unable to fetch block id: ${blockId}`)
    }

}

TransactionTC.addResolver({
    name: 'findByBlockId',
    args: {blockId: 'String!'},
    type: [TransactionTC],
    resolve: async ({_, args, context, info}: ResolverResolveParams<unknown,unknown, {blockId: string}>)=>{
        
        const {blockId} = args

        return getTransactionsPerBlock(blockId)
        
    }
})

export default TransactionTC
export {getTransactionsPerBlock, Transaction,TransactionAPIRespnse}
