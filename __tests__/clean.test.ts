import { buildSchema, FieldNode, Kind, OperationDefinitionNode } from "graphql";
import gql from "graphql-tag";
import { cleanDocument, generateJDTFromSchema } from '../src/index';
import demoSchema from "./utils/demo-schema";


test("clean document - basic test", () => {
  const rootSchema = generateJDTFromSchema(demoSchema);
  const query = gql`query testQuery {
    lll: pocket {
      id
    }
    pocket {
      version
    }
  }`;

  const newQuery = cleanDocument(query, rootSchema);
  // logger.log("newQuery",  newQuery);
  expect(newQuery.definitions).toHaveLength(1);
  const operation = newQuery.definitions[0] as OperationDefinitionNode;
  expect(operation.selectionSet.selections).toHaveLength(1);
});



test("clean document - arguments", () => {
  const rootSchema = generateJDTFromSchema(demoSchema);
  const query = gql`query testQuery($req: String, $optional: String) {
    req: pocket(req: $req) {
      id
    }
    optional: pocket(version: $optional) {
      id
      version
    }
  }`;

  const newQuery = cleanDocument(query, rootSchema);
  // logger.log("newQuery",  newQuery);
  expect(newQuery.definitions).toHaveLength(1);
  const operation = newQuery.definitions[0] as OperationDefinitionNode;
  expect(operation.selectionSet.selections).toHaveLength(2);
  expect(operation.variableDefinitions).toHaveLength(1);
  const variableDef = (operation.variableDefinitions || [])[0];
  expect(variableDef?.variable.name.value).toBe("req")
  const pocketArgs = operation.selectionSet.selections.find((s) => {
    return s.kind === Kind.FIELD && s.alias?.value === "optional";
  }) as FieldNode;

  expect(pocketArgs.arguments).toHaveLength(0);
});
