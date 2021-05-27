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

这里要注意用了`as const`断言的话，类型中会出现很多`readonly`:

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

这极大扰乱了创建泛型`Schema`的过程，首先我们应该把类型中的`readonly`去掉，[StackOverflow 的一个答案](https://stackoverflow.com/a/43001581/522810)提供了移除 readonly 的方法(面向 SO 开发中)：

```TypeScript
type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
```

## 起步

所谓工欲善其事必先利其器，在开始类型实现之前，首先要确保方便有效的测试手段，这样就能通过 TDD 的方式快速试错来修正我们的泛型。介于类型错误在 TypeScript 编译阶段就能检查，我们甚至不需要 jest 这样的 test runner 和断言库，直接通过`tsc --watch`就能在命令行中实时看到泛型是否出了问题，而 VSCode 的实时错误提醒就是最好的错误提示器，但这需要一个前提：能写出 test case 来！这其实并不容易，我们想要的，是一个函数`ExpectTypeEqual`，然后可以这样：

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
