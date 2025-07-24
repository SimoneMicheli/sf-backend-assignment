import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import TransactionTC from "./transactionSchema";
import { totalTransactionsListEnergy } from "../energy/energyUtils";
import { GraphQLError } from "graphql";
import energyProcessor from "../energy/energy";

const WalletTC = schemaComposer.createObjectTC({
    name: "wallet",
    fields: {
        address: 'String!',
        energy: 'Float',
        transactions: [TransactionTC]
    }
})

WalletTC.addResolver({
    name: 'findByAddress',
    type: WalletTC,
    args: {
        address: 'String!'
    },
    resolve: async ({_, args}:ResolverResolveParams<unknown,unknown,{address:string}>)=>{
        const {address} = args

        try{

            const transactions = await energyProcessor.getTransactionsPerWallet(address)

            return {
                address: address,
                energy: totalTransactionsListEnergy(transactions),
                transactions: transactions
            }

        }catch(error){

            console.error(error, `Unable to process wallet ${address}`)
            throw new GraphQLError(`Unable to process wallet ${address}`)
        }
    }
})

export default WalletTC