export type ConstSchema<T> = T extends { const: any } ? T['const'] : never;
