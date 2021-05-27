# TypeScript 泛型实验：TypeScript 泛型解析 JSONSchema（1）

最近看到一篇知乎文章（或者是回答？）提到在 TypeScript 中直接用 JSONSchema 来定义类型，然后通过 TypeScript 的泛型来把 Schema 转化成 TypeScript 类型，这样来实现在编译期（通过 TypeScript）和运行时（通过 JSONSchema Validator)同时验证类型，非常有意思（抱歉我找了好久也没找到是哪篇文章了，知道这篇文章的朋友请告知一下）。不过在那篇文章中只实现了比较基础的一些类型转换，我就在想能不能做得更多一些，这个文章就是系列尝试的第一篇。

当然，退一步来讲，现在已经有很多种方式实现编译期和运行时的共同验证：

1. 可以先写 JSONSchema,然后把 JSONScheme 转化成 TypeScript 的`.d.ts` ([json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript))
2. 可以先定义 TypeScript 类型，然后把类型转化成 JSONSchema（[typescript-json-schema](https://www.npmjs.com/package/typescript-json-schema)）
3. 可以通过[io-ts](https://github.com/gcanti/io-ts)这个库定义运行时类型，这个库会推断 TypeScript 类型
4. 可以用[class-validator](https://github.com/typestack/class-validator)这个库累通过装饰器定义和验证类型

但这显然并不能阻止我们继续折腾发掘新的方式是不是 🙂

## 概念

通过泛型进行类型转换的基本概念，就是设计一个泛型类型`Scheme`，用 JSONSchema 的字面量作为参数，输出 JSONSchema 对应的 TypeScript 类型。简单来说就是这样：

```TypeScript
const schemaObj = {
  description: 'An Object.',
  type: 'object',
  properties: {
    foo: {
      type: 'number',
    },
    bar: {
      type: 'string',
      enum: ['a', 'b', 'c'],
    },
  },
  additionalProperties: false,
} as const; // 注意: 这里必须 as const 来定义字面量，否则JSONSchema中的type、enum都将是string, 无法生成类型

type TypeObj = Schema<typeof schemaObj>;
// TypeObj 将是 {foo?: number; bar?: "a" | "b" | "c"}
```

这里要注意用了 `as const` 断言的话，类型中会出现很多 `readonly` :

```TypeScript
const schemaObj = {
  type: 'object',
  properties: {
    foo: {
      type: 'number',
    },
  },
} as const;

// 这里schemaObj的类型是：
type T = {
    readonly type: "object";
    readonly properties: {
        readonly foo: {
            readonly type: "number";
        };
    };
}
```

这极大扰乱了创建泛型`Schema`的过程，首先我们应该把类型中的`readonly`去掉，[StackOverflow 的这个答案](https://stackoverflow.com/a/43001581/522810)提供了移除 `readonly` 的方法(面向 SO 开发中)：

```TypeScript
type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
```

## 起步

所谓工欲善其事必先利其器，在开始类型实现之前，首先要确保方便有效的测试手段，这样就能通过 TDD 的方式快速试错来修正我们的泛型。介于类型错误在 TypeScript 编译阶段就能检查，我们甚至不需要 jest 这样的 test runner 和断言库，直接通过`tsc --watch`就能在命令行中实时看到泛型是否出了问题，而 VSCode 的实时错误提醒就是最好的错误提示器，但这需要一个前提：能写出 test case 来！这其实并不容易，我们想要的，是一个函数 `ExpectTypeEqual` ，然后可以这样：

```TypeScript
ExpectTypeEqual<TypeA, TypeB>();
// 如果TypeA和TypeB不严格相同，则报编译错
```

遗憾的是我没有找到方法写出这样的函数，所以退而求其次，我们可以先有：

```TypeScript
function Expect<T extends true>(): T | void {}
function ExpectNot<T extends false>(): T | void {}
```

以及泛型`Equal<TypeA, TypeB>`：当类型 TypeA 和 TypeB 严格相同时，返回字面量`true`，否则返回`false`。

感谢 Github，让我在[一个 issue 的讨论中](https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650)找到了这样的泛型：

```TypeScript
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
```

这个泛型并不完美，在 issue 中有充分的讨论，感兴趣的话可以点进去深入阅读。不过对于我们来说就已经足够了：

```TypeScript
Expect<Equal<false, false>>();
ExpectNot<Equal<false, true>>();

Expect<Equal<any, any>>();
ExpectNot<Equal<undefined, any>>();
ExpectNot<Equal<null, any>>();
ExpectNot<Equal<string, any>>();
ExpectNot<Equal<undefined, null>>();
```

全部通过！Nice~~

## 基本类型

我们先从[Understanding JSON Schema](https://json-schema.org/understanding-json-schema/index.html)这本书的基本类型开始。JSONSchema 的类型有`string`、`number`、`integer`、`object`、`array`、`boolean`和`null`。对于`object`和`array`来说，如果没有其他约束我们可以假定其类型是 `Record<string, any>` 和 `any[]`。这样的基本类型定义就靠这样的 JSONSchema 来定义：

```JSON
{ "type": "number" }
```

那么就开始吧！

先完成 test case:

```TypeScript
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

const objectSchema = { type: 'object' } as const;
Expect<Equal<Schema<typeof objectSchema>, Record<string, any>>>();

const arraySchema = { type: 'array' } as const;
Expect<Equal<Schema<typeof arraySchema>, any[]>>();
```

每个泛型类型都可以简单地通过 `T extends { type: 'type' } ? type : never` 来实现，然后组合起来即可：

```TypeScript
type StringSchema<T> = T extends { type: 'string' } ? string : never;
type NumberSchema<T> = T extends { type: 'number' } ? number : never;
type IntegerSchema<T> = T extends { type: 'integer' } ? number : never;
type BooleanSchema<T> = T extends { type: 'boolean' } ? boolean : never;
type NullSchema<T> = T extends { type: 'null' } ? null : never;

// 组合起来
type SingleSchema<T> =
  | StringSchema<T>
  | NumberSchema<T>
  | IntegerSchema<T>
  | BooleanSchema<T>
  | NullSchema<T>;
export type Schema<T> = SingleSchema<DeepWriteable<T>>;
```

立刻就完成了！

## 基本类型的组合类型

然而，事情并不会那么简单。JSONSchema 的`type`是可以组合的！

下面这个例子，数据就可以是 number 或者是 string，但不能是其他类型。

```JSON
{ "type": ["number", "string"] }
```

对于这样的 JSONSchema，就需要转化成 TypeScript 联合类型。

我们先从两个 test case 开始:

```TypeScript
const UnionSchema = { type: ['boolean', 'string'] } as const;
Expect<Equal<Schema<typeof UnionSchema>, string | boolean>>();

// 覆盖object
const basicObjectUnionSchema = { type: ['boolean', 'string', 'object'] } as const;
Expect<Equal<Schema<typeof basicObjectUnionSchema>, string | boolean | any[]>>();
```

首先想到的是用 infer 提取出 type 来：

```TypeScript
type UnionSchema<T> = T extends {type: infer R;} ? GetUnionFrom<R> : never;
```

但这样怎么实现 `GetUnionFrom` 呢？`R` 将会是各种类型名称的字面量的元组类型（比如上面的例子`{ "type": ["number", "string"] }`中是元组`['number', 'string']`，显然我们需要把这个字符串字面量元组转换成对应的联合类型。

第一步想到的当然是把这个字符字面量元组转换成字符字面量联合类型：

```TypeScript
type GetUnionFrom<T> = T[number];
```

然而这第一步就显然行不通，因为 `T` 没有约束，并不一定是数组类型，这里也需要用 `extends` 加上约束：

```TypeScript
type GetUnionFrom<T> = T extends Array<
  'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array'
>
  ? T[number] // 这样会得到形如'number'|'string'的联合类型
  : never;
```

注意我们这个约束直接把数组类型约束到了能用作 `type` 的字符串字面量，如果存在其他字符串则是不规范的 JSONSchema，我们应该返回 `never`.

这里我们只能获得一个类型名称字面量的联合类型（上面的例子就是获得`'number'|'string'`），所以还需要一个步骤来把它们转化成对应的类型，联合类型的对应转换可以像这样通过另一个泛型来做到：

```TypeScript
type ConvertToString<T extends number> = `${T}`;
type Z = ConvertToString<1 | 2 | 3>;  // 把 1|2|3 转化成 '1'|'2'|'3'
```

所以我们先要实现一个这样的转换，这也可以用 extends 来做：

```TypeScript
type SimpleType<T> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'integer'
  ? number
  : T extends 'boolean'
  ? boolean
  : T extends 'null'
  ? null
  : T extends 'object'
  ? Record<string, any>
  : T extends 'array'
  ? any[]
  : never;
```

最后把它们组合在一起：

```TypeScript
type SimpleType<T> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'integer'
  ? number
  : T extends 'boolean'
  ? boolean
  : T extends 'null'
  ? null
  : T extends 'object'
  ? Record<string, any>
  : T extends 'array'
  ? any[]
  : never;

type GetUnionFrom<T> = T extends Array<
  'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array'
>
  ? SimpleType<T[number]>
  : never;

type UnionSchema<T> = T extends { type: infer R } ? GetUnionFrom<R> : never;

// 和上面的基本类型组合在一起：
type BasicSchema<T> = SingleSchema<T> | UnionSchema<T>;
export type Schema<T> = BasicSchema<DeepWriteable<T>>;
```

我们的 test case 就通过啦！🎉

## 优化

但是！！！这个实现未免也太难看了一点，而且几个类型字符串字面量多次重复也非常不优雅，现在来看看怎么改进吧！既然是字符串和对应类型的映射，首先想到的当然就是一个真正的类型映射：

```TypeScript
type SimpleTypes = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  null: null;
  object: Record<string, any>;
  array: any[];
};
```

那取得类型字面量联合的方法也很清晰，就是 `keyof SimpleTypes` 嘛！回到 `UnionSchema` 上来，也不是必须用上 `infer` 来取得类型吧，其实类型可以简单地这样来取得：

```TypeScript
type UnionSchema<T> = T extends { type: Array<keyof SimpleTypes> }
  ? GetUnionFrom<T['type']> // T['type'] 和 infer一样， T['type'][number] 就是类型字面量联合
  : never;
```

既然 `T['type'][number]` 可以拿到类型字面量联合，那就可以结合上面的 `SimpleTypes` 来直接映射类型啦！最终组合起来就是

```TypeScript
type SimpleTypes = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  null: null;
  object: Record<string, any>;
  array: any[];
};

type UnionSchema<T> = T extends { type: Array<keyof SimpleTypes> }
  ? SimpleTypes[T['type'][number]]>
  : never;
```

替换掉之前的 `UnionSchema<T>`，一切工作正常！

等等，那之前单个的基本类型不也可以这样优化吗？😓

一切顺理成章：

```TypeScript
type SingleSchema<T> = T extends { type: keyof SimpleTypes } ? SimpleTypes[T['type']] : never;
```

最终全部代码：

```TypeScript
type SimpleTypes = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  null: null;
  object: Record<string, any>;
  array: any[];
};

type SingleSchema<T> = T extends { type: keyof SimpleTypes } ? SimpleTypes[T['type']] : never;

type UnionSchema<T> = T extends { type: Array<keyof SimpleTypes> }
  ? SimpleTypes[T['type'][number]]
  : never;

type BasicSchema<T> = SingleSchema<T> | UnionSchema<T>;

export type Schema<T> = BasicSchema<DeepWriteable<T>>;
```

终于完成 JSONSchema 基本类型的转化！

本文总结：活用类型映射能事半功倍哦~

## 下一篇

在这篇文章中我们成功把 JSONSchema 的基本类型转换成 TypeScript 类型了，下一篇文章让我们来尝试数组吧！

注：本文代码已上传至[GitHub 仓库](https://github.com/YuJianrong/jsonschema-ts-type)，欢迎 Fork 和提 PR，大家一起来做类型体操吧！
