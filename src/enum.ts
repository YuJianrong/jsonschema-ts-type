export type EnumSchema<T> = T extends { enum: any[] } ? T['enum'][number] : never;
