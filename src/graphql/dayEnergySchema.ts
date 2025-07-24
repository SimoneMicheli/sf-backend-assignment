import { GraphQLJSON, ResolverResolveParams, schemaComposer } from "graphql-compose";
import TransactionTC from "./transactionSchema";
import { GraphQLError } from "graphql";
import energyProcessor from "../energy/energy";
import { DEFAULT_DAYS_BACK, MAX_DAYS_BACK, MIN_DAYS_BACK } from "../constants";

const DayEnergyTC = schemaComposer.createObjectTC({
    name: 'dayEnergy',
    fields: {
        date: 'Date!',
        energy: 'Float',
        errors: [GraphQLJSON!],
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
            defaultValue: DEFAULT_DAYS_BACK
        }
    },
    resolve: async({_, args} : ResolverResolveParams<unknown,unknown,ResolverArgs>)=>{

        const {days} = args

        if (typeof days !== "number" || days < MIN_DAYS_BACK || days > MAX_DAYS_BACK || !Number.isInteger(days)){
            throw new GraphQLError("Number of days must be a positive integer number between 1 and 5")
        }

        return energyProcessor.getMultipleDaysConsumption(days)
    }
})

export default DayEnergyTC