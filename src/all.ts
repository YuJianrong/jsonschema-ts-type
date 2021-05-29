import { TypedArraySchema } from './array';
import { BasicSchema } from './basic';
import { ObjectSchema } from './object';
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
