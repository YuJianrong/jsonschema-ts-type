type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

// Primitive
type StringSchema<T> = T extends { type: 'string' } ? string : never;
type NumberSchema<T> = T extends { type: 'number' } ? number : never;
type IntegerSchema<T> = T extends { type: 'integer' } ? number : never;
type BooleanSchema<T> = T extends { type: 'boolean' } ? boolean : never;
type NullSchema<T> = T extends { type: 'null' } ? null : never;

// Enum
type EnumSchema<T> = T extends { enum: any[] } ? T['enum'][number] : never;

// Array
type AnyArraySchema<T> = T extends { type: 'array' } ? any[] : never;
type TypedArraySchema<T> = T extends { type: 'array'; items: Record<string, unknown> }
  ? WritableSchema<T['items']>[]
  : never;

// Tuple
type LengthOf<T extends { length: number }> = T['length'];
type Head<T> = T extends [...head: infer R, tail: any] ? R : never;
type TupleUnion<A extends { length: number }, Min = 0> = LengthOf<A> extends Min
  ? A
  : TupleUnion<Head<A>, Min> | A;

type SimpleTupleSchema<A extends any[]> = A extends [head: infer H, ...tail: infer T]
  ? [WritableSchema<H>, ...SimpleTupleSchema<T>]
  : [];

type TupleMinItemsSchema<T> = T extends { type: 'array'; items: any[]; minItems: infer M }
  ? TupleUnion<SimpleTupleSchema<T['items']>, M>
  : T extends { type: 'array'; items: any[] }
  ? TupleUnion<SimpleTupleSchema<T['items']>>
  : never;

type TupleAdditionalItemsSchema<T> = T extends {
  type: 'array';
  items: any[];
  additionalItems: false;
}
  ? TupleMinItemsSchema<T>
  : T extends {
      type: 'array';
      items: any[];
      additionalItems: infer M;
    }
  ? TupleMinItemsSchema<T> | [...SimpleTupleSchema<T['items']>, ...WritableSchema<M>[]]
  : T extends {
      type: 'array';
      items: any[];
    }
  ? TupleMinItemsSchema<T> | [...SimpleTupleSchema<T['items']>, ...any[]]
  : never;

type TupleOrArraySchema<T> = T extends { type: 'array'; items: any[] }
  ? TupleAdditionalItemsSchema<T>
  : T extends { type: 'array'; items: Record<string, unknown> }
  ? TypedArraySchema<T>
  : AnyArraySchema<T>;

type OptionalObjectSchema<T> = T extends {
  type: 'object';
  properties: infer P;
}
  ? { [K in keyof P]?: Schema<P[K]> }
  : never;

// Object
type ExpandObject<T> = { [K in keyof T]: T[K] };
type PlainObjectSchema<T> = T extends {
  type: 'object';
  properties: infer P;
  required: infer R;
}
  ? R extends string[]
    ? ExpandObject<
        { [K in Exclude<keyof P, R[number]>]?: Schema<P[K]> } &
          { [K in Extract<keyof P, R[number]>]: Schema<P[K]> }
      >
    : OptionalObjectSchema<T>
  : OptionalObjectSchema<T>;

type ObjectSchema<T> = T extends {
  type: 'object';
  additionalProperties: false;
}
  ? PlainObjectSchema<T>
  : T extends {
      type: 'object';
      additionalProperties: infer M;
    }
  ? PlainObjectSchema<T> & Record<string, WritableSchema<M>>
  : T extends {
      type: 'object';
    }
  ? PlainObjectSchema<T> & Record<string, any>
  : never;

// Simple Union (type: ['string', 'number'])
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

// Const
type ConstSchema<T> = T extends { const: infer C } ? C : never;

// Put together
type NonEnumSchema<T> =
  | StringSchema<T>
  | NumberSchema<T>
  | IntegerSchema<T>
  | BooleanSchema<T>
  | NullSchema<T>
  | SimpleUnionSchema<T>
  | TupleOrArraySchema<T>
  | ObjectSchema<T>;

type WritableSchema<T> = EnumSchema<T> extends never
  ? ConstSchema<T> extends never
    ? NonEnumSchema<T>
    : ConstSchema<T>
  : EnumSchema<T>;

export type Schema<T> = WritableSchema<DeepWriteable<T>>;
