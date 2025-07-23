import { SchemaComposer } from 'graphql-compose'
import TransactionTC from './graphql/transactionSchema'
import DayEnergyTC from './graphql/dayEnergySchema'
import WalletTC from './WalletEnergy'

const schemaComposer = new SchemaComposer()

schemaComposer.Query.addFields({
  transactionsEnergy: TransactionTC.getResolver("findByBlockId"),
  lastDaysEnergy: DayEnergyTC.getResolver("getEnergyLastDays"),
  walletEnergy: WalletTC.getResolver("findByAddress")
})

export const schema = schemaComposer.buildSchema()
