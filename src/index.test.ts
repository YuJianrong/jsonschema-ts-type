import { Schema } from 'index';

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;
function Type<T extends true>(): T | undefined {
  return;
}

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
Type<Equal<Schema<typeof typedTupleSchema>, [number, string, 'Street' | 'Avenue' | 'Boulevard']>>();

const untypedSchema = { type: 'array' } as const;
Type<Equal<Schema<typeof untypedSchema>, string[]>>();

// type ZZ<T> = {[k in keyof T]: Schema<T[k]> };
// type ZZZ = SimpleTupleSchema<[{"type": "number"},{"type": "string"}]>

// type Z = Schema<[{ type: 'number' }, { type: 'string' }]>;

// type T = TupleSchema<DeepWriteable<typeof typedTupleSchema>>;

// console.log('xx');
