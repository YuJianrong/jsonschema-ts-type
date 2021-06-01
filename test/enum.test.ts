import { Schema } from '../src';
import { Equal, Expect } from './testHelper';

const enumSchema = { enum: ['null', 1, null, 'hello'] } as const;
Expect<Equal<Schema<typeof enumSchema>, null | 'null' | 1 | 'hello'>>();

const stringEnumSchema = { type: 'string', enum: ['null', 'hello'] } as const;
Expect<Equal<Schema<typeof stringEnumSchema>, 'null' | 'hello'>>();

const numberEnumSchema = { type: 'number', enum: [1, 2, 3] } as const;
Expect<Equal<Schema<typeof numberEnumSchema>, 1 | 2 | 3>>();

const enumInObjSchema = {
  type: 'object',
  properties: { superPower: { enum: ['China', 'US'] } },
  additionalProperties: false,
} as const;
Expect<Equal<Schema<typeof enumInObjSchema>, { superPower?: 'China' | 'US' }>>();
