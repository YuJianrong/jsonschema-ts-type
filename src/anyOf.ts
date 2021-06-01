import type { WritableSchema } from './all';

type MapAnyOfTuple<T extends any[]> = T extends [...infer Heads, infer Tail]
  ? MapAnyOfTuple<Heads> | WritableSchema<Tail>
  : never;

export type AnyOfSchema<T> = T extends {
  anyOf: any[];
}
  ? MapAnyOfTuple<T['anyOf']>
  : never;
