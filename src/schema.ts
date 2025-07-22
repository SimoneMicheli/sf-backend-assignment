import { SchemaComposer } from 'graphql-compose'
import TransactionTC from './Transaction'
import DayEnergyTC from './DayEnergy'

const schemaComposer = new SchemaComposer()

schemaComposer.Query.addFields({
  transactionsEnergy: TransactionTC.getResolver("findByBlockId"),
  dailyEnergy: DayEnergyTC.getResolver("getEnergyLastDays")
})

export const schema = schemaComposer.buildSchema()
