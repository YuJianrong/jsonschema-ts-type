import { Schema } from './index';

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

function Type<T extends true>(): T | undefined {
  return;
}

Type<Equal<undefined, undefined>>();

const stringSchema = { type: 'string', minLength: 2 } as const;
Type<Equal<Schema<typeof stringSchema>, string>>();

const numberSchema = { type: 'number', minimum: 0 } as const;
Type<Equal<Schema<typeof numberSchema>, number>>();
const integerSchema = { type: 'integer', minimum: 0 } as const;
Type<Equal<Schema<typeof integerSchema>, number>>();

const booleanSchema = { type: 'boolean' } as const;
Type<Equal<Schema<typeof booleanSchema>, boolean>>();

const nullSchema = { type: 'null' } as const;
Type<Equal<Schema<typeof nullSchema>, null>>();

const enumSchema = { enum: ['null', 1, null, 'hello'] } as const;
Type<Equal<Schema<typeof enumSchema>, null | 'null' | 1 | 'hello'>>();

const stringEnumSchema = { type: 'string', enum: ['null', 'hello'] } as const;
Type<Equal<Schema<typeof stringEnumSchema>, 'null' | 'hello'>>();

const numberEnumSchema = { type: 'number', enum: [1, 2, 3] } as const;
Type<Equal<Schema<typeof numberEnumSchema>, 1 | 2 | 3>>();

const simpleUnionSchema = { type: ['boolean', 'string'] } as const;
Type<Equal<Schema<typeof simpleUnionSchema>, string | boolean>>();

const typedStringArraySchema = { type: 'array', items: { type: 'string' } } as const;
Type<Equal<Schema<typeof typedStringArraySchema>, string[]>>();

const typedUnionArraySchema = { type: 'array', items: { type: ['string', 'boolean'] } } as const;
Type<Equal<Schema<typeof typedUnionArraySchema>, (string | boolean)[]>>();

const typedTupleSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'string' },
    { type: 'string', enum: ['Street', 'Avenue', 'Boulevard'] },
  ],
} as const;
Type<
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
Type<
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
Type<
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
Type<
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
Type<
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
Type<
  Equal<
    Schema<typeof typedAdditionalStringMinItemsTupleSchema>,
    | [number, string]
    | [number, string, 'Street' | 'Avenue' | 'Boulevard']
    | [number, string, 'Street' | 'Avenue' | 'Boulevard', ...('Good' | null)[]]
  >
>();

const untypedArraySchema = { type: 'array' } as const;
Type<Equal<Schema<typeof untypedArraySchema>, any[]>>();

const objectSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { enum: ['Street', 'Avenue', 'Boulevard'] },
  },
} as const;
Type<
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
Type<
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
Type<
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
Type<
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
Type<Equal<Schema<typeof constStringSchema>, 'Hello'>>();

const constNumberSchema = {
  const: 1.23,
} as const;
Type<Equal<Schema<typeof constNumberSchema>, 1.23>>();

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
