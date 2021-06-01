import { AnyOfSchema } from './anyOf';
import { TypedArraySchema } from './array';
import { BasicSchema } from './basic';
import { ConstSchema } from './const';
import { EnumSchema } from './enum';
import { ObjectSchema } from './object';
import { TupleSchema } from './tuple';

export type ShortCircuited<T extends any[]> = T extends [infer Head, ...infer Rest]
  ? [Head] extends [never]
    ? ShortCircuited<Rest>
    : Head
  : never;

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

export type WritableSchema<T> = ShortCircuited<
  [
    ConstSchema<T>,
    EnumSchema<T>,
    AnyOfSchema<T>,
    ObjectSchema<T>,
    TupleSchema<T>,
    TypedArraySchema<T>,
    BasicSchema<T>,
  ]
>;

export type Schema<T> = WritableSchema<DeepWriteable<T>>;
