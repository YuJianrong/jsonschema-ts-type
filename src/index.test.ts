/* eslint-disable @typescript-eslint/no-empty-function */
import { Schema } from '.';

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

function Expect<T extends true>(): T | void {}

function ExpectNot<T extends false>(): T | void {
  return;
}

Expect<Equal<false, false>>();
ExpectNot<Equal<false, true>>();

Expect<Equal<any, any>>();
ExpectNot<Equal<undefined, any>>();
ExpectNot<Equal<null, any>>();
ExpectNot<Equal<string, any>>();
ExpectNot<Equal<undefined, null>>();

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

const enumSchema = { enum: ['null', 1, null, 'hello'] } as const;
Expect<Equal<Schema<typeof enumSchema>, null | 'null' | 1 | 'hello'>>();

const stringEnumSchema = { type: 'string', enum: ['null', 'hello'] } as const;
Expect<Equal<Schema<typeof stringEnumSchema>, 'null' | 'hello'>>();

const numberEnumSchema = { type: 'number', enum: [1, 2, 3] } as const;
Expect<Equal<Schema<typeof numberEnumSchema>, 1 | 2 | 3>>();

const simpleUnionSchema = { type: ['boolean', 'string'] } as const;
Expect<Equal<Schema<typeof simpleUnionSchema>, string | boolean>>();

const typedStringArraySchema = { type: 'array', items: { type: 'string' } } as const;
Expect<Equal<Schema<typeof typedStringArraySchema>, string[]>>();

const typedUnionArraySchema = { type: 'array', items: { type: ['string', 'boolean'] } } as const;
Expect<Equal<Schema<typeof typedUnionArraySchema>, (string | boolean)[]>>();

const typedTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
} as const;
Expect<
  Equal<
    Schema<typeof typedTupleSchema>,
    | []
    | [number]
    | [number, string]
    | [number, string, 'Street' | 'Avenue' | 'Boulevard']
    | [number, string, 'Street' | 'Avenue' | 'Boulevard', ...any[]]
  >
>();

const typedMinItemsTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
  minItems: 2,
} as const;
Expect<
  Equal<
    Schema<typeof typedMinItemsTupleSchema>,
    | [number, string]
    | [number, string, 'Street' | 'Avenue' | 'Boulevard']
    | [number, string, 'Street' | 'Avenue' | 'Boulevard', ...any[]]
  >
>();

const typedNoAdditionalItemsTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
  additionalItems: false,
} as const;
Expect<
  Equal<
    Schema<typeof typedNoAdditionalItemsTupleSchema>,
    [] | [number] | [number, string] | [number, string, 'Street' | 'Avenue' | 'Boulevard']
  >
>();

const typedNoAdditionalMinItemsTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
  additionalItems: false,
  minItems: 2,
} as const;
Expect<
  Equal<
    Schema<typeof typedNoAdditionalMinItemsTupleSchema>,
    [number, string] | [number, string, 'Street' | 'Avenue' | 'Boulevard']
  >
>();

const typedAdditionalStringTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
  additionalItems: { type: 'string' },
} as const;
Expect<
  Equal<
    Schema<typeof typedAdditionalStringTupleSchema>,
    | []
    | [number]
    | [number, string]
    | [number, string, 'Street' | 'Avenue' | 'Boulevard']
    | [number, string, 'Street' | 'Avenue' | 'Boulevard', ...string[]]
  >
>();

const typedAdditionalStringMinItemsTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
  minItems: 2,
  additionalItems: { enum: ['Good', null] },
} as const;
Expect<
  Equal<
    Schema<typeof typedAdditionalStringMinItemsTupleSchema>,
    | [number, string]
    | [number, string, 'Street' | 'Avenue' | 'Boulevard']
    | [number, string, 'Street' | 'Avenue' | 'Boulevard', ...('Good' | null)[]]
  >
>();

const untypedArraySchema = { type: 'array' } as const;
Expect<Equal<Schema<typeof untypedArraySchema>, any[]>>();

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
