import type { WritableSchema } from './all';

type Definitions<T extends Record<string, any>, Path extends string, S> =
  Path extends `${infer Namespace}/${infer Rest}`
    ? Definitions<T[Namespace], Rest, S>
    : WritableSchema<T[Path], S>;

export type RefSchema<T, S> = T extends {
  $ref: `#/${infer Path}`;
}
  ? Definitions<S, Path, S>
  : never;
