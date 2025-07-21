import { ResolverResolveParams, SchemaComposer } from 'graphql-compose'
import TransactionTC from './Transaction'

const schemaComposer = new SchemaComposer()

schemaComposer.Query.addFields({
  /*hello: {
    type: () => 'String!',
    resolve: () => 'Hi there, good luck with the assignment!',
  },*/

  transactionsEnergy: TransactionTC.getResolver("findByBlockId")
})

export const schema = schemaComposer.buildSchema()
