import { Schema } from '../src/all';
import { Equal, Expect } from './testHelper';

const enumSchema = { enum: ['null', 1, null, 'hello'] } as const;
Expect<Equal<Schema<typeof enumSchema>, null | 'null' | 1 | 'hello'>>();

const stringEnumSchema = { type: 'string', enum: ['null', 'hello'] } as const;
Expect<Equal<Schema<typeof stringEnumSchema>, 'null' | 'hello'>>();

const numberEnumSchema = { type: 'number', enum: [1, 2, 3] } as const;
Expect<Equal<Schema<typeof numberEnumSchema>, 1 | 2 | 3>>();

const objectSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { enum: ['Street', 'Avenue', 'Boulevard'] },
  },
} as const;
Expect<
  Equal<
    Schema<typeof objectSchema>,
    {
      number?: number;
      street_name?: string;
      street_type?: 'Street' | 'Avenue' | 'Boulevard';
    } & Record<string, any>
  >
>();

const objectNoAdditionalPropertiesSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { enum: ['Street', 'Avenue', 'Boulevard'] },
  },
  additionalProperties: false,
} as const;
Expect<
  Equal<
    Schema<typeof objectNoAdditionalPropertiesSchema>,
    {
      number?: number;
      street_name?: string;
      street_type?: 'Street' | 'Avenue' | 'Boulevard';
    }
  >
>();

const objectSpecificAdditionalPropertiesSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { enum: ['Street', 'Avenue', 'Boulevard'] },
  },
  additionalProperties: { type: 'string' },
} as const;
Expect<
  Equal<
    Schema<typeof objectSpecificAdditionalPropertiesSchema>,
    {
      number?: number;
      street_name?: string;
      street_type?: 'Street' | 'Avenue' | 'Boulevard';
    } & Record<string, string>
  >
>();

const objectPartialRequiredSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { enum: ['Street', 'Avenue', 'Boulevard'] },
  },
  additionalProperties: false,
  required: ['number', 'street_name'],
} as const;
Expect<
  Equal<
    Schema<typeof objectPartialRequiredSchema>,
    {
      number: number;
      street_name: string;
      street_type?: 'Street' | 'Avenue' | 'Boulevard';
    }
  >
>();

const constStringSchema = {
  const: 'Hello',
} as const;
Expect<Equal<Schema<typeof constStringSchema>, 'Hello'>>();

const constNumberSchema = {
  const: 1.23,
} as const;
Expect<Equal<Schema<typeof constNumberSchema>, 1.23>>();

// type Z = Schema<{
//   description: 'Any validation failures are shown in the right-hand Messages pane.';
//   type: 'object';
//   properties: {
//     foo: {
//       type: 'number';
//     };
//     bar: {
//       type: 'string';
//       enum: ['a', 'b', 'c'];
//     };
//   };
// }>;
