// import { buildSchema, visit, Kind, FieldNode, DocumentNode} from "graphql";

// import generateJDTFromSchema from ".";
// import logger from "./utils/logger";
// import gql from "graphql-tag";
// import { IJtd, IJtdDict, IJtdRoot, JtdType } from "./types/jtd";

// var schema = buildSchema(`
// enum Episode {
//   NEWHOPE
//   EMPIRE
//   JEDI
// }
// type Person {
//   id: ID!
//   name: String!
//   money: Float
//   age: Int
//   fav: Episode
// }
// type Query {
//   peter: Person
//   pocket: Person!
//   people: [Person]!
//   many: [Person]
// }
// type Mutation {
//   pan: Person
// }
// `);

// const rootSchema = generateJDTFromSchema(schema);
// logger.log("done", rootSchema);




// const query = gql`query testQuery {
//   lll: pocket {
//     id
//   }
//   pocket {
//     version
//   }
// }`;
// logger.log("query", query);


// const newQuery = cleanDocument(query, rootSchema);
// logger.log("newQuery",  newQuery);

// // var root = { hello: () => 'Hello world!' };

// // graphql({
// //   source: '{ hello }',
// //   schema,
// //   rootValue: root
// // }).then((response) => {
// //   logger.log(response);
// // });
// /*
//   // 2nd pass
//   let passes = firstPhase;
//   let changed = false;
//   do {
//     fieldPath = [];
//     changed = false;
//     passes = visit(passes, {
//       [Kind.OPERATION_DEFINITION]: {
//         enter: (def, key, parent, path, ancestors) => {
//           if(def.operation === "query") {
//             fieldPath.push("Query");
//           } else {
//             fieldPath.push("Mutation");
//           }
//         },
//         leave: () => {
//           fieldPath.pop();
//         }
//       },
//       [Kind.FIELD]:  {
//         enter: (node, key, parent, path, ancestors) => {
//           fieldPath.push(node.name.value);
//           const type = getTypeFromJDTSchema(fieldPath, schema);
//           console.log("type", type);
//           if(type) {
//           //if type is object and 0 selectionset return null
//             if(!isJTDScalarType(type)) {
//               if(node.selectionSet?.selections.length === 0) {
//                 changed = true;
//                 return null;
//               }
//             }
//             return node;
//           }
//           changed = true;
//           return null;
//         },
//         leave: (node) => {
//           fieldPath.pop();
//         }
//       }
//     });
//   } while(changed)
//   */


// // function validateField(path: string | string[], schema: IJtdRoot<any>) : boolean {
// //   return !!getTypeFromJDTSchema(path, schema);
// //   // let p = path;
// //   // if(!Array.isArray(p)) {
// //   //   p = (path as string).split(".");
// //   // }

// //   // let currentLevel: IJtd<any> = schema;

// //   // for(let x = 0; x < p.length; x++) {
// //   //   const currentPos = p[x];
// //   //   let found = true;
// //   //   let prop;


// //   //   if(currentLevel.properties && currentLevel.properties[currentPos]) {
// //   //     prop = currentLevel.properties[currentPos];
// //   //   } else if(currentLevel.optionalProperties && currentLevel.optionalProperties[currentPos]) {
// //   //     prop = currentLevel.optionalProperties[currentPos];
// //   //   }
// //   //   if (prop) {
// //   //     if(prop.properties || prop.optionalProperties) {
// //   //       currentLevel = prop;
// //   //     } else if(schema.definitions) {
// //   //       if(prop.ref) {
// //   //         currentLevel = schema.definitions[prop.ref];
// //   //       }
// //   //       if(prop.elements?.type) {
// //   //         currentLevel = schema.definitions[prop.elements.type]
// //   //       }
// //   //     }
// //   //   } else {
// //   //     return false;
// //   //   }
// //   // }
// //   // return true;
// // }