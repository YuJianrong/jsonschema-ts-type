import type { WritableSchema } from './all';

export type TypedArraySchema<T, S> = T extends { type: 'array'; items: any }
  ? Array<WritableSchema<T['items'], S>>
  : never;
