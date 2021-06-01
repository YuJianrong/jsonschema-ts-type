# TypeScript 泛型实验：TypeScript 泛型解析 JSONSchema（4）

系列文章进入第四篇，前面几篇我们处理了 JSONSchema 支持的各种基本类型，从这篇开始将会是一些和基本类型不同的 JSONSchema 特性。

## 常量

首先是常量类型定义了。在 JSONSchema 草案第 6 版中有了常量类型定义：

```JSON
{ "const": "China" }
```

那这个真的挺简单的，当然还是先上 test case

```TypeScript
const constNumberSchema = {
  const: 1.23,
} as const;
Expect<Equal<Schema<typeof constNumberSchema>, 1.23>>();

// 再拉个对象类型
const constInObjectSchema = {
  type: 'object',
  properties: {
    country: {
      const: 'China',
    },
  },
  additionalProperties: false,
} as const;
Expect<Equal<Schema<typeof constInObjectSchema>, { country?: 'China' }>>();
```

已经提取过那么多参数了，这个完全没压力啊：

```TypeScript
export type ConstSchema<T> = T extends { const: any } ? T['const'] : never;

// 当然注意这个要放断路器第一个，遇到 const 就不用做其他转化了
export type WritableSchema<T> = ShortCircuited<
  [ConstSchema<T>, ObjectSchema<T>, TupleSchema<T>, TypedArraySchema<T>, BasicSchema<T>]
>;
```

## 枚举

然后就是枚举类型，JSONSchema 的枚举定义也挺简单的：

```JSON
{ "enum": ["red", "amber", "green"]}
```

注意和常量一样，一旦发现了枚举，就不用继续转化下去了，因为枚举是必然符合其他条件要求的。

还是先上 test case

```TypeScript
const enumSchema = { enum: ['null', 1, null, 'hello'] } as const;
Expect<Equal<Schema<typeof enumSchema>, null | 'null' | 1 | 'hello'>>();

const numberEnumSchema = { type: 'number', enum: [1, 2, 3] } as const;
Expect<Equal<Schema<typeof numberEnumSchema>, 1 | 2 | 3>>();

// 也测试一下在对象中表现
const enumInObjSchema = {
  type: 'object',
  properties: { superPower: { enum: ['China', 'US'] } },
  additionalProperties: false,
} as const;
Expect<Equal<Schema<typeof enumInObjSchema>, { superPower?: 'China' | 'US' }>>();
```

和 `const` 类似，怎么写枚举前面几篇文章基本上都已经提到，这里就简单跳过解释了：

```TypeScript
export type EnumSchema<T> = T extends { enum: any[] } ? T['enum'][number] : never;

// 枚举应该在常数之后，如果两个都出现显然只需要考虑常数类型
export type WritableSchema<T> = ShortCircuited<
  [
    ConstSchema<T>,
    EnumSchema<T>,
    //...
  ]
>;
```

test case 的报错都消失了！

## 组合关键词

下面来看看 JSONSchema 的组合关键词 `allOf`、 `anyOf`、 `oneOf` 和 `not`。很不幸 `allOf`， `oneOf` 和 `not`都没有办法写出类型，只能交给 JSONSchema Validator 了，但是 `anyOf` 还是可以的。一般 `anyOf` 是这么写的：

```TypeScript
{
  "anyOf": [
    { "type": "string", "maxLength": 5 },
    { "type": "number", "minimum": 0 }
  ]
}
```

当然，首先还是 test case 先行：

```TypeScript
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

// 也测试一下复杂的类型组合
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
```

回忆一下元组我们是怎么做的呢：

```TypeScript
type MapTuple<T extends any[]> = T extends [...infer Heads, infer Tail]
  ? [...MapTuple<Heads>, WritableSchema<Tail>]
  : [];
```

`AnyOf` 和和元组的唯一区别就是把元组都合并成一个联合类型吧！那就很简单了：

```TypeScript
type MapAnyOfTuple<T extends any[]> = T extends [...infer Heads, infer Tail]
  ? MapAnyOfTuple<Heads> | WritableSchema<Tail>
  : never;

export type AnyOfSchema<T> = T extends {
  anyOf: any[];
}
  ? MapAnyOfTuple<T['anyOf']>
  : never;

// 加进断路器里，注意要加在 const 和 enum 之后，显然 anyOf 优先级应该更低
export type WritableSchema<T> = ShortCircuited<
  [
    ConstSchema<T>,
    EnumSchema<T>,
    AnyOfSchema<T>,
    // ...
  ]
>;
```

test case 全部通过啦！
