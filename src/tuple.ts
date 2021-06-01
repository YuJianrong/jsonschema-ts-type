/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ShortCircuited, WritableSchema } from './all';

type AllTuples<T extends { length: number }, Min> = T['length'] extends Min
  ? T
  : T extends [...infer Heads, infer _Tail]
  ? AllTuples<Heads, Min> | T
  : [];
type MapTuple<T extends any[], S> = T extends [...infer Heads, infer Tail]
  ? [...MapTuple<Heads, S>, WritableSchema<Tail, S>]
  : [];

type SimpleTupleSchema<T, S> = T extends { type: 'array'; items: any[] }
  ? AllTuples<MapTuple<T['items'], S>, 0>
  : never;

type MinItemsTupleSchema<T, S> = T extends { type: 'array'; items: any[]; minItems: number }
  ? AllTuples<MapTuple<T['items'], S>, T['minItems']>
  : never;

type BasicTupleSchema<T, S> = ShortCircuited<[MinItemsTupleSchema<T, S>, SimpleTupleSchema<T, S>]>;

type NoAdditionalItemsTupleSchema<T, S> = T extends {
  type: 'array';
  items: any[];
  additionalItems: false;
}
  ? BasicTupleSchema<T, S>
  : never;

type TypedAdditionalItemsTupleSchema<T, S> = T extends {
  type: 'array';
  items: any[];
  additionalItems: any;
}
  ?
      | BasicTupleSchema<T, S>
      | [...MapTuple<T['items'], S>, ...WritableSchema<T['additionalItems'], S>[]]
  : never;

type AnyTypedAdditionalItemsTupleSchema<T, S> = T extends {
  type: 'array';
  items: any[];
}
  ? BasicTupleSchema<T, S> | [...MapTuple<T['items'], S>, ...any[]]
  : never;

export type TupleSchema<T, S> = ShortCircuited<
  [
    NoAdditionalItemsTupleSchema<T, S>,
    TypedAdditionalItemsTupleSchema<T, S>,
    AnyTypedAdditionalItemsTupleSchema<T, S>,
  ]
>;
