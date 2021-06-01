import type { WritableSchema } from './all';

type MapAnyOfTuple<T extends any[], S> = T extends [...infer Heads, infer Tail]
  ? MapAnyOfTuple<Heads, S> | WritableSchema<Tail, S>
  : never;

export type AnyOfSchema<T, S> = T extends {
  anyOf: any[];
}
  ? MapAnyOfTuple<T['anyOf'], S>
  : never;
