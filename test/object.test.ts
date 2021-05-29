import { Schema } from '../src/all';
import { Equal, Expect } from './testHelper';

const objectSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
} as const;
Expect<
  Equal<
    Schema<typeof objectSchema>,
    {
      number?: number;
      street_name?: string;
      notes?: string[];
    }
  >
>();

const objectPartialRequiredSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { type: 'string' },
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
      street_type?: string;
    }
  >
>();

const objectWithAdditionalPropertiesSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    notes: { type: 'array', items: { type: 'string' } },
  },
} as const;
Expect<
  Equal<
    Schema<typeof objectWithAdditionalPropertiesSchema>,
    {
      number?: number;
      street_name?: string;
      notes?: string[];
      [K: string]: unknown;
    }
  >
>();

const objectPartialRequiredWithAdditionalPropertiesSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { type: 'string' },
  },
  required: ['number', 'street_name'],
} as const;
Expect<
  Equal<
    Schema<typeof objectPartialRequiredWithAdditionalPropertiesSchema>,
    {
      number: number;
      street_name: string;
      street_type?: string;
      [K: string]: unknown;
    }
  >
>();

const objectWithTypedAdditionalPropertiesSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: { type: 'string' },
} as const;
Expect<
  Equal<
    Schema<typeof objectWithTypedAdditionalPropertiesSchema>,
    {
      number?: number;
      street_name?: string;
      notes?: string[];
      [K: string]: unknown;
    }
  >
>();

const objectPartialRequiredWithTypedAdditionalPropertiesSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    street_type: { type: 'string' },
  },
  required: ['number', 'street_name'],
  additionalProperties: { type: 'string' },
} as const;
Expect<
  Equal<
    Schema<typeof objectPartialRequiredWithTypedAdditionalPropertiesSchema>,
    {
      number: number;
      street_name: string;
      street_type?: string;
      [K: string]: unknown;
    }
  >
>();
