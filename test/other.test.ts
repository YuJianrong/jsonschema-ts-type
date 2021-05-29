import { Schema } from '../src/all';
import { Equal, Expect } from './testHelper';

const enumSchema = { enum: ['null', 1, null, 'hello'] } as const;
Expect<Equal<Schema<typeof enumSchema>, null | 'null' | 1 | 'hello'>>();

const stringEnumSchema = { type: 'string', enum: ['null', 'hello'] } as const;
Expect<Equal<Schema<typeof stringEnumSchema>, 'null' | 'hello'>>();

const numberEnumSchema = { type: 'number', enum: [1, 2, 3] } as const;
Expect<Equal<Schema<typeof numberEnumSchema>, 1 | 2 | 3>>();

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
