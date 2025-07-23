import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import TransactionTC from "./transactionSchema";
import axios from "axios";
import { WalletAPIResponse } from "../types/walletType";
import { calcTransactionEnergy, totalTransactionsListEnergy } from "../utils/energyUtils";
import { GraphQLError } from "graphql";
import blockchainAdapter from "../blockchain/blockchainAdapter";

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

            const transactions = await blockchainAdapter.getTransactionsPerWallet(address)

            return {
                address: address,
                energy: totalTransactionsListEnergy(transactions),
                transactions: transactions
            }

        }catch(error){

            console.log(error, `Unable to process wallet ${address} info`)
            throw new GraphQLError(`Unable to process wallet ${address} info`)
        }
    }
})

export default WalletTC