import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const typedTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
} as const;
Expect<
  Equal<
    Schema<typeof typedTupleSchema>,
    | []
    | [number]
    | [number, string]
    | [number, string, boolean]
    | [number, string, boolean, ...any[]]
  >
>();

const typedMinItemsTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
  minItems: 2,
} as const;
Expect<
  Equal<
    Schema<typeof typedMinItemsTupleSchema>,
    [number, string] | [number, string, boolean] | [number, string, boolean, ...any[]]
  >
>();

const typedNoAdditionalItemsTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
  additionalItems: false,
} as const;
Expect<
  Equal<
    Schema<typeof typedNoAdditionalItemsTupleSchema>,
    [] | [number] | [number, string] | [number, string, boolean]
  >
>();

const typedNoAdditionalMinItemsTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
  additionalItems: false,
  minItems: 2,
} as const;
Expect<
  Equal<
    Schema<typeof typedNoAdditionalMinItemsTupleSchema>,
    [number, string] | [number, string, boolean]
  >
>();

const typedAdditionalStringTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
  additionalItems: { type: 'string' },
} as const;
Expect<
  Equal<
    Schema<typeof typedAdditionalStringTupleSchema>,
    | []
    | [number]
    | [number, string]
    | [number, string, boolean]
    | [number, string, boolean, ...string[]]
  >
>();

const typedAdditionalStringMinItemsTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
  minItems: 2,
  additionalItems: { type: 'array', items: { type: 'string' } },
} as const;
Expect<
  Equal<
    Schema<typeof typedAdditionalStringMinItemsTupleSchema>,
    [number, string] | [number, string, boolean] | [number, string, boolean, ...string[][]]
  >
>();
