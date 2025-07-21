import { ResolverResolveParams, SchemaComposer } from 'graphql-compose'
import BlockTC from './Block'

const schemaComposer = new SchemaComposer()

const TransactionTC = schemaComposer.createObjectTC({
    name: 'Transaction',
    fields: {
        id: 'String!',
        energy: 'Int!'
    }
})

schemaComposer.Query.addFields({
  hello: {
    type: () => 'String!',
    resolve: () => 'Hi there, good luck with the assignment!',
  },

  blockById: BlockTC.getResolver('findById')
})

export const schema = schemaComposer.buildSchema()
