import { SchemaComposer } from 'graphql-compose'
import TransactionTC from './Transaction'
import DayEnergyTC from './DayEnergy'
import WalletTC from './WalletEnergy'

const schemaComposer = new SchemaComposer()

schemaComposer.Query.addFields({
  transactionsEnergy: TransactionTC.getResolver("findByBlockId"),
  lastDaysEnergy: DayEnergyTC.getResolver("getEnergyLastDays"),
  walletEnergy: WalletTC.getResolver("findByAddress")
})

export const schema = schemaComposer.buildSchema()
