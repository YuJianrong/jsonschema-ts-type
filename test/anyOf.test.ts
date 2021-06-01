import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const doubleAnyOfSchema = {
  anyOf: [
    { type: 'string', maxLength: 5 },
    { type: 'number', minimum: 0 },
  ],
} as const;
Expect<Equal<Schema<typeof doubleAnyOfSchema>, string | number>>();

const tripleAnyOfSchema = {
  anyOf: [
    { type: 'string', maxLength: 5 },
    { type: 'number', minimum: 0 },
    { enum: [false, null] },
  ],
} as const;
Expect<Equal<Schema<typeof tripleAnyOfSchema>, string | number | false | null>>();

const complexAnyOfSchema = {
  anyOf: [
    {
      type: 'object',
      properties: {
        type: { const: 'address' },
        street_no: { type: 'number' },
        street_type: { type: 'string' },
      },
      additionalProperties: false,
      required: ['type', 'street_no'],
    },
    {
      type: 'object',
      properties: {
        type: { const: 'name' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
      },
      additionalProperties: false,
      required: ['type', 'first_name', 'last_name'],
    },
  ],
} as const;
Expect<
  Equal<
    Schema<typeof complexAnyOfSchema>,
    | { type: 'address'; street_no: number; street_type?: string }
    | { type: 'name'; first_name: string; last_name: string }
  >
>();
