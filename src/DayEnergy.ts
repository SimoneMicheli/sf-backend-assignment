import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import axios, { AxiosError } from 'axios'
import {addDays, endOfToday, getTime} from 'date-fns'
import TransactionTC, { getTransactionsPerBlock, Transaction } from "./Transaction";
import { GraphQLError } from "graphql";
import { truncateSync } from "fs";

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
    let transactions : Array<Transaction> = []

    try {
        const url = `https://blockchain.info/blocks/${millis}?format=json`

        const response = await axios.get<DayBlockAPIResponse[]>(url)
        const blocks = response.data


        const pendingBlocks = blocks.map(block => getTransactionsPerBlock(block.hash))

        /*let pendingBlocks:Promise<Transaction[]>[] = []
        for (let i=0; i<3; i++){
            pendingBlocks = [...pendingBlocks, getTransactionsPerBlock(blocks[i].hash)]
        }*/

        const transactionsPerBlock = await Promise.all(pendingBlocks)

        for(let tblock of transactionsPerBlock){
            // sum up the energy consumed by every transaction in a block
            dayEnergy += tblock.reduce<number>((prevEnergy, t)=>{
                return prevEnergy + t.energy
            },0)
            
            // include the transactions of this block in the day transactions
            transactions = [...transactions, ...tblock]
        }

        return {
            date: day,
            energy: dayEnergy,
            transactions
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
        days: 'Int'
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