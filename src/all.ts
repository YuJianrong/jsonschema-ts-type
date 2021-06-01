import { AnyOfSchema } from './anyOf';
import { TypedArraySchema } from './array';
import { BasicSchema } from './basic';
import { ConstSchema } from './const';
import { EnumSchema } from './enum';
import { ObjectSchema } from './object';
import { RefSchema } from './ref';
import { TupleSchema } from './tuple';

export type ShortCircuited<T extends any[]> = T extends [infer Head, ...infer Rest]
  ? [Head] extends [never]
    ? ShortCircuited<Rest>
    : Head
  : never;

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

export type WritableSchema<T, S> = ShortCircuited<
  [
    RefSchema<T, S>,
    ConstSchema<T>,
    EnumSchema<T>,
    AnyOfSchema<T, S>,
    ObjectSchema<T, S>,
    TupleSchema<T, S>,
    TypedArraySchema<T, S>,
    BasicSchema<T>,
  ]
>;

export type Schema<T> = DeepWriteable<T> extends infer S ? WritableSchema<S, S> : never;
