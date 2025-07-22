import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import TransactionTC, { Transaction, TransactionAPIRespnse } from "./Transaction";
import axios from "axios";
import { calcTransactionEnergy, totalTransactionsListEnergy } from "./EnergyUtils";

interface Wallet{
    address: string,
    energy: number,
    transactions: Transaction[]
}

interface WalletAPIResponse {
    address: string,
    txs: TransactionAPIRespnse[]
}

const WalletTC = schemaComposer.createObjectTC({
    name: "wallet",
    fields: {
        address: 'String!',
        energy: 'Float',
        transactions: [TransactionTC]
    }
})

/*WalletTC.addFields({
    transactions: {
        type: [TransactionTC],
        resolve: (source) =>{
                return source.transactions.map(calTransactionEnergy)
            }
        }
})*/

WalletTC.addResolver({
    name: 'findByAddress',
    type: WalletTC,
    args: {
        address: 'String!'
    },
    resolve: async ({_, args}:ResolverResolveParams<unknown,unknown,{address:string}>)=>{
        const {address} = args

        try{
            const url = `https://blockchain.info/rawaddr/${address}`

            const response = await axios.get<WalletAPIResponse>(url)

            const transactions = response.data.txs.map(calcTransactionEnergy)

            return {
                address: response.data.address,
                energy: totalTransactionsListEnergy(transactions),
                transactions: transactions
            }

        }catch(error){}
    }
})

export default WalletTC
export {Wallet}