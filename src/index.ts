type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

type StringSchema<T> = T extends { type: 'string' } ? string : never;
type NumberSchema<T> = T extends { type: 'number' } ? number : never;
type IntegerSchema<T> = T extends { type: 'integer' } ? number : never;
type BooleanSchema<T> = T extends { type: 'boolean' } ? boolean : never;
type NullSchema<T> = T extends { type: 'null' } ? null : never;

type EnumSchema<T> = T extends { enum: any[] } ? T['enum'][number] : never;
type EnumOrStringSchema<T> = EnumSchema<T> extends never ? StringSchema<T> : EnumSchema<T>;

type AnyArraySchema<T> = T extends { type: 'array' } ? any[] : never;
type TypedArraySchema<T> = T extends { type: 'array'; items: Record<string, unknown> }
  ? Schema<T['items']>[]
  : never;
type SimpleTupleSchema<T> = { [k in keyof T]: Schema<T[k]> };
type TupleSchema<T> = T extends { type: 'array'; items: any[] }
  ? SimpleTupleSchema<T['items']>
  : never;

type TupleOrArraySchema<T> = T extends { type: 'array'; items: any[] }
  ? TupleSchema<T>
  : T extends { type: 'array'; items: Record<string, unknown> }
  ? TypedArraySchema<T>
  : AnyArraySchema<T>;

type SimpleString<T> = T extends 'string' ? string : never;
type SimpleNumber<T> = T extends 'number' ? number : never;
type SimpleInteger<T> = T extends 'integer' ? number : never;
type SimpleBoolean<T> = T extends 'boolean' ? boolean : never;
type SimpleNull<T> = T extends 'null' ? null : never;
type Simple<T> =
  | SimpleString<T>
  | SimpleNumber<T>
  | SimpleInteger<T>
  | SimpleBoolean<T>
  | SimpleNull<T>;
type SimpleUnionSchema<T> = T extends { type: ('string' | 'number' | 'boolean')[] }
  ? Simple<T['type'][number]>
  : never;

type WriteableSchema<T> =
  | EnumOrStringSchema<T>
  | NumberSchema<T>
  | IntegerSchema<T>
  | BooleanSchema<T>
  | NullSchema<T>
  | SimpleUnionSchema<T>
  | TupleOrArraySchema<T>;
export type Schema<T> = WriteableSchema<DeepWriteable<T>>;
