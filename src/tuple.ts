/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ShortCircuited, WritableSchema } from './all';

type AllTuples<T extends { length: number }, Min> = T['length'] extends Min
  ? T
  : T extends [...infer Heads, infer _Tail]
  ? AllTuples<Heads, Min> | T
  : [];
type MapTuple<T extends any[]> = T extends [...infer Heads, infer Tail]
  ? [...MapTuple<Heads>, WritableSchema<Tail>]
  : [];

type SimpleTupleSchema<T> = T extends { type: 'array'; items: any[] }
  ? AllTuples<MapTuple<T['items']>, 0>
  : never;

type MinItemsTupleSchema<T> = T extends { type: 'array'; items: any[]; minItems: number }
  ? AllTuples<MapTuple<T['items']>, T['minItems']>
  : never;

type BasicTupleSchema<T> = ShortCircuited<[MinItemsTupleSchema<T>, SimpleTupleSchema<T>]>;

type NoAdditionalItemsTupleSchema<T> = T extends {
  type: 'array';
  items: any[];
  additionalItems: false;
}
  ? BasicTupleSchema<T>
  : never;

type TypedAdditionalItemsTupleSchema<T> = T extends {
  type: 'array';
  items: any[];
  additionalItems: any;
}
  ? BasicTupleSchema<T> | [...MapTuple<T['items']>, ...WritableSchema<T['additionalItems']>[]]
  : never;

type AnyTypedAdditionalItemsTupleSchema<T> = T extends {
  type: 'array';
  items: any[];
}
  ? BasicTupleSchema<T> | [...MapTuple<T['items']>, ...any[]]
  : never;

export type TupleSchema<T> = ShortCircuited<
  [
    NoAdditionalItemsTupleSchema<T>,
    TypedAdditionalItemsTupleSchema<T>,
    AnyTypedAdditionalItemsTupleSchema<T>,
  ]
>;
