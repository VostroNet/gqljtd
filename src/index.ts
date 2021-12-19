import logger from "./utils/logger";
import {visit, Kind, DocumentNode, GraphQLFieldConfig, GraphQLFieldConfigArgumentMap} from "graphql";

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLType,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLList,
} from "graphql";
import { IJtd, IJtdDict, IJtdRoot, JtdType } from "./types/jtd";


function createType(fieldType: GraphQLType) {
  // const fieldType = !(field as GraphQLFieldConfig<any, any, any>).type ? field as GraphQLType : (field as GraphQLFieldConfig<any, any, any>).type;
  const required = fieldType instanceof GraphQLNonNull;
  let type: GraphQLType;
  if (required) {
    type = (fieldType as GraphQLNonNull<GraphQLType>).ofType;
  } else {
    type = fieldType;
  }
  let isList = false;
  if (type instanceof GraphQLList) {
    isList = true;
    type = type.ofType;
  }
  let typeName = type.toString();
  let typeDef = {} as IJtd;
  if (type instanceof GraphQLScalarType) {
    switch (typeName) {
      case "Int":
        typeDef = { type: JtdType.INT32 };
        break;
      case "ID":
      case "String":
        typeDef = { type: JtdType.STRING };
        break;
      case "Float":
        typeDef = { type: JtdType.FLOAT32 };
        break;
      default:
        logger.err(`no scalar type found for ${typeName}`);
        break;
    }
  } else if (type instanceof GraphQLObjectType) {
    typeDef = { ref: type.name };
  } else if (type instanceof GraphQLEnumType) {
    typeDef = { ref: type.name };
  } else if (type instanceof GraphQLList) {
    throw "TODO: List in list - needs implementing";
  } else {
    logger.err(`unknown gql type ${typeName}`);
  }
  if (isList) {
    typeDef = {elements: typeDef}
  }
  if(required) {
    typeDef.nullable = false;
  } else {
    typeDef.nullable = true;
  }
  // if(obj?.args) {
  //     typeDef.arguments = Object.keys(obj.args).reduce((o, a) => {
  //     if(obj?.args) {
  //       o[a] = createType(obj?.args[a]);
  //     }
  //     return o;
  //   }, {} as IJtdDict);
  // }
  return typeDef;
}

export function createArguments(argMap: GraphQLFieldConfigArgumentMap | undefined) : IJtdDict | undefined {
  if(argMap) {
    const keys = Object.keys(argMap);
    if(keys.length > 0) {
      return keys.reduce((o, k) => {
        o[k] = createType(argMap[k].type);
        return o;
      }, {} as IJtdDict);
    }
  }
  return undefined;
}

export function createTypes(schema: GraphQLSchema) {
  const schemaConfig = schema.toConfig();
  const enums = schemaConfig.types.filter(
    (f) => f instanceof GraphQLEnumType && f.name.indexOf("__") !== 0
  ) as GraphQLEnumType[];
  const objects = schemaConfig.types.filter(
    (f) => f instanceof GraphQLObjectType && f.name.indexOf("__") !== 0
  ) as GraphQLObjectType[];
  return [
    ...objects.map((o) => {
      const objectConfig = o.toConfig();
      const metadata = {
        name: objectConfig.name,
      } as any;
      if (o === schemaConfig.query || o === schemaConfig.mutation || o === schemaConfig.subscription) {
        metadata.rootElement = true;
      }
      return Object.keys(objectConfig.fields).reduce(
        (o, k) => {
          const field = objectConfig.fields[k];
          const typeDef = createType(field.type);
          if (!typeDef.nullable) {
            if (!o.properties) {
              o.properties = {};
            }
            o.properties[k] = typeDef;
          } else {
            if (!o.optionalProperties) {
              o.optionalProperties = {};
            }
            o.optionalProperties[k] = typeDef;
          }
          typeDef.arguments = createArguments(field.args);
          
         
          return o;
        },
        {
          metadata,
          properties: {},
          optionalProperties: {},
        } as IJtd
      );
    }),
    ...enums.map((enumType) => {
      return {
        metadata: {
          name: enumType.name,
        },
        enum: enumType.getValues().map((v) => v.name),
      } as IJtd;
    }),
  ];
}


export function generateJTDFromTypes(types: IJtd[]) {
  const definitions = types
    .filter((t) => !t.metadata?.rootElement)
    .reduce((o, t) => {
      if(t.metadata) {
        o[t.metadata?.name] = t;
      }
      return o;
    }, {} as IJtdDict)
  const optionalProperties = types
    .filter((t) => t.metadata?.rootElement)
    .reduce((o, t) => {
      if(t.metadata) {
        o[t.metadata?.name] = t;
      }
      return o;
    }, {} as IJtdDict)
  return {
    metadata: {},
    definitions,
    optionalProperties
  } as IJtdRoot
}

export function generateJDTFromSchema(schema: GraphQLSchema) {
  const types = createTypes(schema);
  return generateJTDFromTypes(types);
}
export function isJTDScalarType(typeDef: IJtd) {
  switch(typeDef.type) {
    case JtdType.BOOLEAN:
    case JtdType.FLOAT32:
    case JtdType.FLOAT64:
    case JtdType.INT16:
    case JtdType.INT32:
    case JtdType.INT8:
    case JtdType.STRING:
    case JtdType.TIMESTAMP:
    case JtdType.UINT16:
    case JtdType.UINT32:
    case JtdType.UINT8:
      return true;
  }
  return false;
}


function getTypeFromJDTSchema(path: string | string[], schema: IJtdRoot) {
  let p = path;
  if(!Array.isArray(p)) {
    p = (path as string).split(".");
  }

  let currentLevel: IJtd = schema;

  let prop;
  for(let x = 0; x < p.length; x++) {
    prop = undefined;
    const currentPos = p[x];
    if(currentLevel.properties && currentLevel.properties[currentPos]) {
      prop = currentLevel.properties[currentPos];
    } else if(currentLevel.optionalProperties && currentLevel.optionalProperties[currentPos]) {
      prop = currentLevel.optionalProperties[currentPos];
    }
    if (prop) {
      if(prop.properties || prop.optionalProperties) {
        currentLevel = prop;
      } else if(schema.definitions) {
        if(prop.ref) {
          currentLevel = schema.definitions[prop.ref];
        }
        if(prop.elements?.type) {
          currentLevel = schema.definitions[prop.elements.type]
        }
      }
    } else {
      return undefined;
    }
  }
  if(prop?.ref && schema.definitions) {
    return schema.definitions[prop.ref];
  }
  return prop;
}



export function cleanDocument(query: DocumentNode, schema: IJtdRoot) {
  let fieldPath = [] as string[];
  const newSchema = visit(query, {
    [Kind.OPERATION_DEFINITION]: {
      enter: (def, key, parent, path, ancestors) => {
        if(def.operation === "query") {
          fieldPath.push("Query");
        } else {
          fieldPath.push("Mutation");
        }
      },
      leave: () => {
        fieldPath.pop();
      }
    },
    [Kind.FIELD]:  {
      enter: (node, key, parent, path, ancestors) => {
        fieldPath.push(node.name.value);
        const isValid = getTypeFromJDTSchema(fieldPath, schema);
        if (isValid) {
          return node;
        }
        return null;
      },
      leave: (node, key, parent, path, ancestors) => {
        fieldPath.pop();
        if (node) {
          const type = getTypeFromJDTSchema(fieldPath, schema);
          if(type && !isJTDScalarType(type)) {
            if(node.selectionSet?.selections.length === 0) {
              return null;
            }
          }
        }
        return undefined
      }
    }
  });

  return newSchema;
}