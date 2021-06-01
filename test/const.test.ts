import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const constStringSchema = {
  const: 'Hello',
} as const;
Expect<Equal<Schema<typeof constStringSchema>, 'Hello'>>();

const constNumberSchema = {
  const: 1.23,
} as const;
Expect<Equal<Schema<typeof constNumberSchema>, 1.23>>();

const constInObjectSchema = {
  type: 'object',
  properties: {
    country: {
      const: 'China',
    },
  },
  additionalProperties: false,
} as const;
Expect<Equal<Schema<typeof constInObjectSchema>, { country?: 'China' }>>();
