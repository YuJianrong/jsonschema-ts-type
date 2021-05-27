type SimpleTypes = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  null: null;
  object: Record<string, any>;
  array: any[];
};

type SingleSchema<T> = T extends { type: keyof SimpleTypes } ? SimpleTypes[T['type']] : never;

type UnionSchema<T> = T extends { type: Array<keyof SimpleTypes> }
  ? SimpleTypes[T['type'][number]]
  : never;

export type BasicSchema<T> = SingleSchema<T> | UnionSchema<T>;
