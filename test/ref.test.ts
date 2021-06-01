import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const refSchema = {
  definitions: {
    address: {
      type: 'object',
      properties: {
        street_address: { type: 'string' },
        city: { type: 'string' },
      },
      additionalProperties: false,
      required: ['street_address', 'city', 'state'],
    },
  },
  anyOf: [{ $ref: '#/definitions/address' }, { enum: ['residential', 'business'] }],
} as const;
Expect<
  Equal<
    Schema<typeof refSchema>,
    'residential' | 'business' | { street_address: string; city: string }
  >
>();

const nestedRefSchema = {
  definitions: {
    foo: {
      bar: { enum: ['residential', 'business'] },
    },
    hello: {
      world: {
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }],
        additionalItems: false,
        minItems: 2,
      },
      isComing: { $ref: '#/definitions/hello/world' },
    },
  },
  type: 'object',
  properties: {
    bar: { $ref: '#/definitions/foo/bar' },
    world: { $ref: '#/definitions/hello/world' },
    isComing: { $ref: '#/definitions/hello/isComing' },
    foo: { const: 'foo' },
  },
  additionalProperties: false,
} as const;
Expect<
  Equal<
    Schema<typeof nestedRefSchema>,
    {
      bar?: 'residential' | 'business';
      world?: [string, number];
      isComing?: [string, number];
      foo?: 'foo';
    }
  >
>();
