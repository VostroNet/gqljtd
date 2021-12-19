import { buildSchema } from "graphql";

export default buildSchema(`
enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}
type Person {
  id: ID!
  name: String!
  money: Float
  age: Int
  fav: Episode
}
type Query {
  peter: Person
  pocket(req: String): Person!
  people: [Person]!
  many: [Person]
}
type Mutation {
  pan: Person
}
`);