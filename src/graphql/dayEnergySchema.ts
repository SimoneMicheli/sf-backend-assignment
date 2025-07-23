import { ResolverResolveParams, schemaComposer } from "graphql-compose";
import TransactionTC from "./transactionSchema";
import { GraphQLError } from "graphql";
import energyProcessor from "../energy/energy";

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

        if (typeof days !== "number" || days < 1 || days > 5 || !Number.isInteger(days)){
            throw new GraphQLError("Number of days must be a positive integer number between 1 and 5")
        }

        return energyProcessor.getMultipleDaysConsumption(days)
    }
})

export default DayEnergyTC