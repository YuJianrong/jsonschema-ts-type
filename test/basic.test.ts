import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const stringSchema = { type: 'string', minLength: 2 } as const;
Expect<Equal<Schema<typeof stringSchema>, string>>();

const numberSchema = { type: 'number', minimum: 0 } as const;
Expect<Equal<Schema<typeof numberSchema>, number>>();

const integerSchema = { type: 'integer', minimum: 0 } as const;
Expect<Equal<Schema<typeof integerSchema>, number>>();

const booleanSchema = { type: 'boolean' } as const;
Expect<Equal<Schema<typeof booleanSchema>, boolean>>();

const nullSchema = { type: 'null' } as const;
Expect<Equal<Schema<typeof nullSchema>, null>>();

const objectSchema = { type: 'object' } as const;
Expect<Equal<Schema<typeof objectSchema>, Record<string, any>>>();

const arraySchema = { type: 'array' } as const;
Expect<Equal<Schema<typeof arraySchema>, any[]>>();

const basicUnionSchema = { type: ['boolean', 'number', 'string'] } as const;
Expect<Equal<Schema<typeof basicUnionSchema>, string | number | boolean>>();

const basicObjectUnionSchema = { type: ['integer', 'null', 'array', 'object'] } as const;
Expect<Equal<Schema<typeof basicObjectUnionSchema>, number | null | any[] | Record<string, any>>>();
