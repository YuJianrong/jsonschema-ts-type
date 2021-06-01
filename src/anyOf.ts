import type { WritableSchema } from './all';

type MapAnyOf<T extends any[], S> = T extends [...infer Heads, infer Tail]
  ? MapAnyOf<Heads, S> | WritableSchema<Tail, S>
  : never;

export type AnyOfSchema<T, S> = T extends {
  anyOf: any[];
}
  ? MapAnyOf<T['anyOf'], S>
  : never;
