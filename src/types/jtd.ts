// https://github.com/smikhalevski/jtdc/blob/master/packages/types/src/main/jtd-types.ts
/**
 * JTD standard data types.
 */
export const enum JtdType {
  BOOLEAN = 'boolean',
  STRING = 'string',

  /**
   * JSON strings containing an RFC3339 timestamp.
   *
   * ```ts
   * "1985-04-12T23:20:50.52Z"
   * ```
   */
  TIMESTAMP = 'timestamp',
  FLOAT32 = 'float32',
  FLOAT64 = 'float64',
  INT8 = 'int8',
  UINT8 = 'uint8',
  INT16 = 'int16',
  UINT16 = 'uint16',
  INT32 = 'int32',
  UINT32 = 'uint32',
}

export interface IJtdDict {
  [name: string]: IJtd;
}

/**
 * The JTD with embedded definitions.
 *
 * @see https://tools.ietf.org/html/rfc8927 RFC8927
 * @see https://jsontypedef.com/docs/jtd-in-5-minutes JTD in 5 minutes
 */
export interface IJtdRoot extends IJtd {
  definitions?: IJtdDict;
}

/**
 * The definition of a type.
 */
export interface IJtd {
  metadata?: IJtdMetadata;
  nullable?: boolean;
  ref?: string;
  type?: JtdType | string;
  enum?: Array<string>;
  elements?: IJtd;
  values?: IJtd;
  properties?: IJtdDict;
  optionalProperties?: IJtdDict;
  discriminator?: string;
  mapping?: IJtdDict;
  arguments?: IJtdDict
}

export interface IJtdMetadata {
  name: string,
  rootElement: boolean,
}