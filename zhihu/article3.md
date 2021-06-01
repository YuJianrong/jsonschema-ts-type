#! https://zhuanlan.zhihu.com/p/376388589

# TypeScript 泛型解析 JSONSchema（3）

系列文章进入第三篇，这一篇我们会开始尝试转化（可能是最重要的）JSONSchema 特性：对象。还没阅读过之前文章的读者请从第一篇开始阅读。

在第一篇中我们已经实现了最基础的 `{ "type": "object" }`，但这显然是远远不够的，对象类型的 JSONSchema 最有用的当然是属性定义，这也是显而易见必须支持的。

## 属性

JSONSchema 中可以这样定义属性：

```JSON
{
  "type": "object",
  "properties": {
    "number": { "type": "number" },
    "street_name": { "type": "string" }
  }
}
```

当然还是先定义 tets cases:

```TypeScript
const objectSchema = {
  type: 'object',
  properties: {
    number: { type: 'number' },
    street_name: { type: 'string' },
    notes: { type: 'array', items: { type: 'string' } },
  },
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
```

由于 JSONSchema 中的属性缺省是可选的，所以我们的 test case 也要应该定义为可选。

映射一个对象属性的泛型很常见十分好写，这里的关键点又是取得 JSONSchema 定义的 `properties`，由于取得的类型需要复用，我们改用 `infer` 来推断：

```TypeScript

type ObjectSchema<T> = T extends {
  type: 'object';
  properties: infer P;
}
  ? { [K in keyof P]?: WritableSchema<P[K]> }
  : never;

// 再和之前的短路类型连接起来
type WritableSchema<T> = ShortCircuited<
  [ObjectSchema<T>, TupleSchema<T>, TypedArraySchema<T>, BasicSchema<T>]
>;
```

test cases 立刻就通过了。

## 必选属性

在上面的实现中，我们所有属性都定义成了可选属性，然而在 JSONSchema 的 Object 中，部分属性也可以定义为必选类型，比如：

```JSON
{
  "type": "object",
  "properties": {
    "number": { "type": "number" },
    "street_name": { "type": "string" },
    "street_type": { "type": "string" }
  },
  "required": ["number", "street_name"]
}
```

这也是应该支持的。还是 Test case 先行：

```TypeScript
const objectPartialRequiredSchema = {
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
    Schema<typeof objectPartialRequiredSchema>,
    {
      number: number;
      street_name: string;
      street_type?: string;
    }
  >
>();
```

看到 `required` 是个数组，立刻联想到第一篇文章取得联合类型的方式：`T['required']`，我们只要把 `properties` 的 key 分成两部分，一本分是必选一部分是可选，然后再用 `&` 合起来就可以了：

```TypeScript
type RequiredObjectSchema<T> = T extends {
  type: 'object';
  properties: infer P;
  required: infer R;
}
         // 这里需要用 Extract，因为 required 中可能包含不催在于 properties 的元素
  ? { [K in Extract<keyof P, T['required'][number]>]: WritableSchema<P[K]> } &
      { [K in Exclude<keyof P, T['required'][number]>]?: WritableSchema<P[K]> }
  : never;

// 原来的 ObjectSchema 改名为 OptionalObjectSchema 并用短路泛型连起来
type ObjectSchema<T> = ShortCircuited<[RequiredObjectSchema<T>, OptionalObjectSchema<T>]>;
```

然而 test case 报错了……原来我们的泛型 `Equal<>` 认为类型 `{a: number;} & {b: string;}` 和 `{a: number; b: string;}` 是不同的。既然交叉类型看起来确实不好看，我们还是应该把它们合并，合并交叉类型的简单方法就是再来一个泛型：

```TypeScript
type MergeIntersection<T> = { [K in keyof T]: T[K] };

type RequiredObjectSchema<T> = T extends {
  type: 'object';
  properties: infer P;
  required: string[];
}
  ? MergeIntersection<
      { [K in Extract<keyof P, T['required'][number]>]: WritableSchema<P[K]> } &
        { [K in Exclude<keyof P, T['required'][number]>]?: WritableSchema<P[K]> }
    >
  : never;
```

大功告成。

## 额外属性

JSONSchema 的 `object` 类型还有一个特性：在已定义的属性外还可以添加任意属性，这个特性由参数 `additionalProperties` 定义，有三种可能：

1. 未定义 `additionalProperties`，则额外属性可以是任意类型
2. 定义为 `false`，则没有额外属性
3. 定义为特定类型的 JSONSchema，则额外属性为定义的类型

在 TypeScript 中可以这样来定义任意额外属性：

```TypeScript
interface Obj {
  propertyA: string;
  propertyB: string;
  [K: string]: unknown;
}
```

但是！这里的 `unknown` 是不能替换为具体类型的。因为在 TypeScript 中，如果要像上面那样定义任意属性的话，`[K: string]` 定义的属性不能和其他属性冲突：

```TypeScript
interface Obj {
  propertyA: string;
  propertyB: string;
  [K: string]: boolean;
}
// Error: Property 'propertyA' of type 'string' is not assignable to string index type 'boolean'.
```

所以可以说 (3) 是做不到的，那么我们只要判断 `additionalProperties` 定义为 `false` 的情形，其他情形就 `[K: string]: unknown;` 好了。

首先是 test case，我们来把所有组合都找出来：

```TypeScript
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
```

对于 `OptionalObjectSchema` 和 `RequiredObjectSchema`， 我们可以加上参数 `AdditionalProperties`，由这个参数来控制是否要加入 `[K: string]: unknown`，由于 `[K in keyof P]` 和 `[K: string]` 也是冲突的，我们还要再用上 `MergeIntersection`:

```TypeScript
type OptionalObjectSchema<T, AdditionalProperties> = T extends {
  type: 'object';
  properties: infer P;
}
  ? AdditionalProperties extends false
    ? { [K in keyof P]?: WritableSchema<P[K]> }
    : MergeIntersection<{ [K in keyof P]?: WritableSchema<P[K]> } & Record<string, unknown>>
  : never;

type RequiredObjectSchema<T, AdditionalProperties> = T extends {
  type: 'object';
  properties: infer P;
  required: string[];
}
  ? AdditionalProperties extends false
    ? MergeIntersection<
        { [K in Extract<keyof P, T['required'][number]>]: WritableSchema<P[K]> } &
          { [K in Exclude<keyof P, T['required'][number]>]?: WritableSchema<P[K]> }
      >
    : MergeIntersection<
        { [K in Extract<keyof P, T['required'][number]>]: WritableSchema<P[K]> } &
          { [K in Exclude<keyof P, T['required'][number]>]?: WritableSchema<P[K]> } &
          Record<string, unknown>
      >
  : never;
```

原本的 `ObjectSchema` 也要改写成 `PropertiesOnlyObjectSchema` 来加入新的断路器：

```TypeScript
type PropertiesOnlyObjectSchema<T, AdditionalProperties> = ShortCircuited<
  [RequiredObjectSchema<T, AdditionalProperties>, OptionalObjectSchema<T, AdditionalProperties>]
>;

type NoAdditionalPropertiesObjectSchema<T> = T extends {
  type: 'object';
  properties: any;
  additionalProperties: false;
}
  ? PropertiesOnlyObjectSchema<T, false>
  : never;

type AdditionalPropertiesObjectSchema<T> = PropertiesOnlyObjectSchema<T, true>;

type ObjectSchema<T> = ShortCircuited<
  [NoAdditionalPropertiesObjectSchema<T>, AdditionalPropertiesObjectSchema<T>]
>;
```

检查一下 test case，全部通过了！

## 其他特性

JSONSchema 在 Object 上还支持很多其他属性，比如可定义属性名字的正则 `propertyNames`，比如可定义最少/最多多少个属性 `minProperties`/`maxProperties` 等等，这些在 TypeScript 类型上无法支持，就只能留给 JSON Validator 了。

本文总结：交叉类型很有用，而把交叉类型展开的类型更易读。

## 下一篇

下一篇文章我们将尝试转化 JSONSchema 一些常用的关键字和组合方式。

注：本文代码已上传至[GitHub 仓库](https://github.com/YuJianrong/jsonschema-ts-type)，欢迎 Fork 和提 PR，大家一起来做类型体操吧！

### 系列文章索引

- [TypeScript 泛型解析 JSONSchema（1）](https://zhuanlan.zhihu.com/p/375740178)
- [TypeScript 泛型解析 JSONSchema（2）](https://zhuanlan.zhihu.com/p/375918832)
- [TypeScript 泛型解析 JSONSchema（3）](https://zhuanlan.zhihu.com/p/376388589)
- [TypeScript 泛型解析 JSONSchema（4）](https://zhuanlan.zhihu.com/p/376943084)
- [TypeScript 泛型解析 JSONSchema（5）](https://zhuanlan.zhihu.com/p/376943197)
