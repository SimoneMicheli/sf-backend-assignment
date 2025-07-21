import { ResolverResolveParams, schemaComposer } from 'graphql-compose'
import axios from 'axios'

interface Block {
    id: string,
    energy: number
}

const TransactionTC = schemaComposer.createObjectTC({
    name: 'Transaction',
    fields: {
        id: 'String!',
        energy: 'Float!'
    }
})

const BlockTC = schemaComposer.createObjectTC({
    name: 'Block',
    fields: {
        id: 'String!',
        blockEnergy: 'Float!',
        transactions: [TransactionTC!]!
    }
})

/*BlockTC.addFields({
    transactions: {
        type: [TransactionTC],
        resolve: () => []
    }
})*/

function calcEnergy(){}

BlockTC.addResolver({
    name: 'findById',
    args: {id: 'String!'},
    type: BlockTC,
    resolve: async ({_, args}: ResolverResolveParams<unknown,unknown, {id: string}>)=>{
        
        const {id} = args

        const url = `https://blockchain.info/rawblock/${id}`
        try{
            const {data} = await axios.get(url)

            const transactions : Array<Block> = data.tx.map((t:{hash: string, size: number}) => ({id: t.hash, energy: t.size * 4.56}))

            const block = {id: data.hash, transactions, blockEnergy: transactions.reduce((acc,t)=>(acc + t.energy),0) }

            return block
        }catch (error){
            return {id: id,energy: 100}
        }


        
    }
})

export default BlockTC