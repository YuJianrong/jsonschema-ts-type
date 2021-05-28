import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const typedStringArraySchema = { type: 'array', items: { type: 'string' } } as const;
Expect<Equal<Schema<typeof typedStringArraySchema>, string[]>>();

const typed2DStringArraySchema = {
  type: 'array',
  items: { type: 'array', items: { type: 'string' } },
} as const;
Expect<Equal<Schema<typeof typed2DStringArraySchema>, string[][]>>();

const typedUnionArraySchema = { type: 'array', items: { type: ['string', 'boolean'] } } as const;
Expect<Equal<Schema<typeof typedUnionArraySchema>, (string | boolean)[]>>();
