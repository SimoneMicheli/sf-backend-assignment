import { omit, ResolverResolveParams, schemaComposer } from 'graphql-compose'
import { GraphQLError } from 'graphql'
import axios, { AxiosError } from 'axios'

interface Block {
    hash: string,
    energy: number
}

interface Transaction {
    hash: string,
    size: number,
    energy: number
}

type TransactionAPI = Omit<Transaction,'energy'>

interface Context {
    transactions: Array<Transaction>
}

const TransactionTC = schemaComposer.createObjectTC({
    name: 'Transaction',
    fields: {
        hash: 'String!',
        energy: 'Float!'
    },
})

TransactionTC.addResolver({
    name: 'findByBlockId',
    args: {blockId: 'String!'},
    type: [TransactionTC],
    resolve: async ({_, args, context, info}: ResolverResolveParams<unknown,unknown, {blockId: string}>)=>{
        
        const {blockId} = args

        const url = `https://blockchain.info/rawblock/${blockId}`
        try{
            const {data} = await axios.get(url)

            //const transactions = data.tx as Array<Transaction>

            const transactions : Transaction[] = data.tx.map(
                (t:TransactionAPI) => ({hash: t.hash, energy: t.size * 4.56})
            )

            //const block = {id: data.hash, transactions, blockEnergy: transactions.reduce((acc,t)=>(acc + t.energy),0) }

            return transactions
        }catch (error){

            const err = error as AxiosError
            throw new GraphQLError(err.message)
        }


        
    }
})

const BlockTC = schemaComposer.createObjectTC({
    name: 'Block',
    fields: {
        id: 'String!',
        blockEnergy: 'Float!',
        //transactions: [TransactionTC!]!
    }
})

/*BlockTC.addFields({
    transactions: {
        type: [TransactionTC!]!,
        resolve: ({_, args, context, info}) => [

            return 
        ]
    }
})*/

function calcEnergy(){}

BlockTC.addResolver({
    name: 'findById',
    args: {id: 'String!'},
    type: BlockTC,
    resolve: async ({_, args, context, info}: ResolverResolveParams<unknown,Context, {id: string}>)=>{
        
        const {id} = args

        const url = `https://blockchain.info/rawblock/${id}`
        try{
            const {data} = await axios.get(url)

            context.transactions = data.tx as Array<Transaction>

            const transactions : Array<Block> = data.tx.map((t:{hash: string, size: number}) => ({id: t.hash, energy: t.size * 4.56}))

            const block = {id: data.hash, transactions, blockEnergy: transactions.reduce((acc,t)=>(acc + t.energy),0) }

            return block
        }catch (error){

            const err = error as AxiosError
            throw new GraphQLError(err.message)
        }


        
    }
})

export default BlockTC
export {TransactionTC}