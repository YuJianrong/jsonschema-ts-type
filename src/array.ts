import type { WritableSchema } from './all';

export type TypedArraySchema<T> = T extends { type: 'array'; items: any }
  ? Array<WritableSchema<T['items']>>
  : never;
