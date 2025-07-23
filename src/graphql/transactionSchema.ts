import { ResolverResolveParams, schemaComposer } from 'graphql-compose'
import blockchainAdapter from '../blockchain/blockchainAdapter'

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

        return blockchainAdapter.getTransactionsPerBlock(blockId)
        
    }
})

export default TransactionTC