import { ResolverResolveParams, schemaComposer } from 'graphql-compose'
import { GraphQLError } from 'graphql'
import axios, { AxiosError } from 'axios'
import { Wallet } from './WalletEnergy'
import { calcTransactionEnergy } from './EnergyUtils'

interface Transaction {
    hash: string,
    size: number,
    energy: number
}

type TransactionAPIRespnse = Omit<Transaction,'energy'>

interface BlockAPIResponse {
    hash: string,
    tx: Array<TransactionAPIRespnse>
}

const TransactionTC = schemaComposer.createObjectTC({
    name: 'Transaction',
    fields: {
        hash: 'String!',
        energy: 'Float!'
    },
})

async function getTransactionsPerBlock(blockId:string) : Promise<Transaction[]> {
    const url = `https://blockchain.info/rawblock/${blockId}`
    try{
        const {data} = await axios.get<BlockAPIResponse>(url)

        const transactions : Transaction[] = data.tx.map(calcTransactionEnergy)

        return transactions
    }catch (error){

        const err = error as AxiosError
        throw new GraphQLError(err.message)
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
