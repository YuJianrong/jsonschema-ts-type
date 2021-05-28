import { TypedArraySchema } from './array';
import { BasicSchema } from './basic';
import { TupleSchema } from './tuple';

export type ShortCircuited<T extends any[]> = T extends [infer Head, ...infer Rest]
  ? [Head] extends [never]
    ? ShortCircuited<Rest>
    : Head
  : never;

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

// Enum
type EnumSchema<T> = T extends { enum: any[] } ? T['enum'][number] : never;

// Array

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

export type WritableSchema<T> = ShortCircuited<
  [
    ConstSchema<T>,
    EnumSchema<T>,
    ObjectSchema<T>,
    TupleSchema<T>,
    TypedArraySchema<T>,
    BasicSchema<T>,
  ]
>;

export type Schema<T> = WritableSchema<DeepWriteable<T>>;
