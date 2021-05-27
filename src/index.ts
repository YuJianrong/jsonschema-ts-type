import { BasicSchema } from './basic';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

// Primitive

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

// Const
type ConstSchema<T> = T extends { const: infer C } ? C : never;

type WritableSchema<T> = EnumSchema<T> extends never
  ? ConstSchema<T> extends never
    ? TupleOrArraySchema<T> extends never
      ? ObjectSchema<T> extends never
        ? BasicSchema<T>
        : ObjectSchema<T>
      : TupleOrArraySchema<T>
    : ConstSchema<T>
  : EnumSchema<T>;

export type Schema<T> = WritableSchema<DeepWriteable<T>>;
