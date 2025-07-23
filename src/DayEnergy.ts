import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import axios, { AxiosError } from 'axios'
import {addDays, endOfToday, getTime} from 'date-fns'
import { GraphQLError } from "graphql";
import { totalTransactionsListEnergy } from "./utils/energyUtils";
import { Transaction } from "./types/transactionType";
import TransactionTC from "./graphql/transactionSchema";
import blockchainAdapter from "./blockchain/blockchainAdapter";

interface DayBlockAPIResponse {
    height: number,
    hash: string,
    time: number
}

interface DayEnergy {
    date: Date,
    energy: number | null,
    transactions: Transaction[] | null
}

const DayEnergyTC = schemaComposer.createObjectTC({
    name: 'dayEnergy',
    fields: {
        date: 'Date!',
        energy: 'Float',
        transactions: [TransactionTC]
    }
})

interface ResolverArgs {
    days: number
}

async function getDayConsumption(day: Date){
    const millis = getTime(day)

    let dayEnergy = 0
    let dayTransactions : Array<Transaction> = []

    try {
        const url = `https://blockchain.info/blocks/${millis}?format=json`

        const response = await axios.get<DayBlockAPIResponse[]>(url)
        const blocks = response.data


        const pendingBlocks = blocks.map(block => blockchainAdapter.getTransactionsPerBlock(block.hash))

        const transactionsPerBlocks = await Promise.all(pendingBlocks)

        // there are a list of blocks per day, every block contains a list of transactions
        for(let transactions of transactionsPerBlocks){
            // sum up the energy consumed by every transaction in a block
            dayEnergy += totalTransactionsListEnergy(transactions)
            
            // include the transactions of this block in the day transactions
            dayTransactions = [...dayTransactions, ...transactions]
        }

        return {
            date: day,
            energy: dayEnergy,
            transactions: dayTransactions
        }
                
    }
    catch{

        return {
            date: day,
            energy: null,
            transactions: null
        }
    }
}

DayEnergyTC.addResolver({
    name: 'getEnergyLastDays',
    type:  [DayEnergyTC],
    args: {
        days: {
            type: 'Int',
            defaultValue: 1
        }
    },
    resolve: async({_, args} : ResolverResolveParams<unknown,unknown,ResolverArgs>)=>{

        const {days} = args

        if (typeof days !== "number" || days < 1 || days > 5){
            throw new GraphQLError("Number of days must be a positive number between 1 and 5")
        }

        let daysEnergy : Array<DayEnergy> = []

        for(let day=0; day<days; day++){

            const date = addDays(endOfToday(), -day)

            const dayConsumption = await getDayConsumption(date)

            daysEnergy = [...daysEnergy, dayConsumption]

        }

        return daysEnergy
    }
})

export default DayEnergyTC