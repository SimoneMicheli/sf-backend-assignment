import { ResolverResolveParams, schemaComposer } from 'graphql-compose'
import { GraphQLError } from 'graphql'
import axios, { AxiosError } from 'axios'

interface Transaction {
    hash: string,
    size: number,
    energy: number
}

type TransactionAPI = Omit<Transaction,'energy'>

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

            const transactions : Transaction[] = data.tx.map(
                (t:TransactionAPI) => ({hash: t.hash, energy: t.size * 4.56})
            )

            return transactions
        }catch (error){

            const err = error as AxiosError
            throw new GraphQLError(err.message)
        }


        
    }
})

export default TransactionTC