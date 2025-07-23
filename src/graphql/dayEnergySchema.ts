import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import TransactionTC from "./transactionSchema";
import { GraphQLError } from "graphql";
import {addDays, endOfToday, getTime} from 'date-fns'
import { DayEnergy } from "../types/dayType";
import blockchainAdapter from "../blockchain/blockchainAdapter";

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

            const dayConsumption = await blockchainAdapter.getDayConsumption(date)

            daysEnergy = [...daysEnergy, dayConsumption]

        }

        return daysEnergy
    }
})

export default DayEnergyTC