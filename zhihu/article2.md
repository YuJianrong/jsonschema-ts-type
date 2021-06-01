#! https://zhuanlan.zhihu.com/p/375918832

# TypeScript 泛型解析 JSONSchema（2）

这是系列文章的第二篇，还不知道上下文的读者请从第一篇开始阅读。

在第一篇文章中我们成功实现了基本类型 JSONSchema 对 TypeScript 类型的转换，这一篇文章我们来尝试数组吧？首先问题是：在第一篇文章里我们似乎已经实现了数组了啊？

```TypeScript
const arraySchema = { type: 'array' } as const;
Expect<Equal<Schema<typeof arraySchema>, any[]>>();
```

但这种只是 JSONSchema 里数组最基本的定义，[JSONSchema 的数组还有着很多丰富的定义形式](https://json-schema.org/understanding-json-schema/reference/array.html)，全都转化成 `any[]` 也太粗糙了，既然 JSONSchema 还能更精细地定义数组，我们当然也要尽量把定义正确地转换出来。

## 数组成员定义

在 JSONSchema 中数组成员可以通过这个方式定义:

```JSON
{
  "type": "array",
  "items": {
    "type": "number"
  }
}
```

很显然 `items` 就是递归的 JSONSchema，泛型也是可以递归的，这就很容易啦，当然，还是 test case 先行：

```TypeScript
const typedStringArraySchema = { type: 'array', items: { type: 'string' } } as const;
Expect<Equal<Schema<typeof typedStringArraySchema>, string[]>>();

// 也试试二维数组
const typed2DStringArraySchema = {
  type: 'array',
  items: { type: 'array', items: { type: 'number' } },
} as const;
Expect<Equal<Schema<typeof typed2DStringArraySchema>, number[][]>>();

// 以及联合类型
const typedUnionArraySchema = { type: 'array', items: { type: ['string', 'boolean'] } } as const;
Expect<Equal<Schema<typeof typedUnionArraySchema>, (string | boolean)[]>>();
```

就和第一篇文章使用 `T['type']` 这个技巧一样，我们也可以这样来写这个类型：

```TypeScript
type TypedArraySchema<T> = T extends { type: 'array'; items: any }
  ? WritableSchema<T['items']>[]
  : never;

// 结合第一篇文章的 BasicSchema：
type WritableSchema<T> = BasicSchema<T> | TypedArraySchema<T>;

export type Schema<T> = BasicSchema<DeepWriteable<T>>;
```

简单又直接！😄

## 短路操作

但是！这样做的 test case 居然出错了，那么我们来看看类型是啥：

```TypeScript
type Z = Schema<typeof typedStringArraySchema>;
// 类型是 any[] | string[]
```

这是因为我们用了联合类型：

```TypeScript
type WritableSchema<T> = BasicSchema<T> | TypedArraySchema<T>;
// BasicSchema<T> 得出 any[], TypedArraySchema 得出string[]
```

那么这里有两个解决方案：

1. 让 `BasicSchema<T>` 不返回 `any[]`。
2. 先做 `TypedArraySchema<T>`，如果失败（说明没有定义 `items` ）再做 `BasicSchema<T>`。

显然(2)更合理一些，我们就朝这个方向做：

```TypeScript
// 在 TypedArraySchema<T> 上短路
type WritableSchema<T> = [TypedArraySchema<T>] extends [never]
  ? BasicSchema<T>
  : TypedArraySchema<T>;
```

_注意：这里需要 `[TypedArraySchema<T>] extends [never]` 是因为 `extends never` 用在联合类型上的话将会产生不符合预期的结果，详见[Github 的这篇 issue](https://github.com/microsoft/TypeScript/issues/31751#issuecomment-498526919)。_

test case 都过啦！

不过考虑到类似的短路操作将会有很多场景需要（对象类型、枚举类型），那也值得把这个短路操作做成泛型：

```TypeScript
type ShortCircuited<A, B> = [A] extends [never] ? B : A;
type WritableSchema<T> = ShortCircuited<TypedArraySchema<T>, BasicSchema<T>>;
```

只是这样加入其它类型也还是需要嵌套的 `ShortCircuited<>` 了，一样不好看啊，短路操作能不能做成多个参数呢？好消息是 TypeScript 4.0 提供了 Variadic Tuple Types（可变元组类型）！结合 extends 和递归就有更多玩法：

```TypeScript
type ShortCircuited<T extends any[]> = T extends [infer Head, ...infer Rest]
  ? [Head] extends [never]
    ? ShortCircuited<Rest>
    : Head
  : never;
// 递归执行 ShortCircuited 直到不是 never

// 那么 WritableSchema 就可以写成
type WritableSchema<T> = ShortCircuited<[TypedArraySchema<T>, BasicSchema<T>]>;
// 以后更多类型往后面添加就行了
```

## 元组类型

看起来已经很好了，然而，JSONSchema 还支持元组类型！

```JSON
{
  "type": "array",
  "items": [
    { "type": "number" },
    { "type": "string" },
    { "type": "boolean" },
  ]
}
```

怎么能就此停止呢，元组类型也要来！当然还是先上 test case：

```TypeScript
const typedTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
} as const;
Expect<Equal<Schema<typeof typedTupleSchema>, [number, string, boolean]>>();
```

提取 items 的类型那已经驾轻就熟了：

```TypeScript
type TupleSchema<T> = T extends { type: 'array'; items: any[] }
  ? T['items'] : never;
```

_注意：这里需要用 `items: any[]`，这样不是数组的 `items` 类型还可以继续交给 `TypedArraySchema<>` 去处理。_

元祖类型的映射也有[Github issue](https://github.com/microsoft/TypeScript/issues/25947#issuecomment-407930249)提到：

```TypeScript
type MapTuple<T extends any[]> = { [K in keyof T]: WritableSchema<T[K]> };
// 和上面组合起来：
type TupleSchema<T> = T extends { type: 'array'; items: any[] }
  ? MapTuple<T['items']>
  : never;
// 再加上短路：
type WritableSchema<T> = ShortCircuited<
  [TupleSchema<T>, TypedArraySchema<T>, BasicSchema<T>]
>;
```

啊，简单又直接，但是！我们发现 JSONSchema 的元组并不要求提供所有成员！上面这个例子中， `[1, 'a', true]` 和 `[1, 'a']` 都是合法的，甚至 `[]` 都是！这就有点麻烦了啊……可以说 test case 应该是：

```TypeScript
Expect<
  Equal<
    Schema<typeof typedTupleSchema>,
    [] | [number] | [number, string] | [number, string, boolean]
  >
>();
```

当然有了 TypeScript 4.0 的可变元组类型的泛型，这怎么能难倒我们呢?

```TypeScript
type AllTuples<T> =
  T extends [...infer Heads, infer _Tail] ? AllTuples<Heads> | T : [];
// type Z = AllTuples<[1, 2, 3]>; 将会生成类型 [] | [1] | [1, 2] | [1, 2, 3]

// TupleSchema 就变成
type TupleSchema<T> = T extends { type: 'array'; items: any[] }
  ? AllTuples<MapTuple<T['items']>>
  : never;
```

## 元组最小长度

不过显然 JSONSchema 不会让我们那么容易达到目标的。JSONSchema 的数组不仅可以是元组，还能设定长度限制！

```JSON
{
  "type": "array",
  "minItems": 2,
}
```

对于数组类型就算了，这个实在没必要（也做不到），但元组类型可就要精确点啊，那么 `minItems` 能用在类型生成上吗？结论当然是可以的，元组的 `length` 就是一个 number 字面量！这就产生了很多方法了啊：

```TypeScript
type AllTuples<T extends { length: number }, Min> = T['length'] extends Min
  ? T
  : T extends [...infer Heads, infer _Tail]
  ? AllTuples<Heads, Min> | T
  : [];
// 把原来的 TupleSchema 分开
type SimpleTupleSchema<T> = T extends { type: 'array'; items: any[] }
  ? AllTuples<MapTuple<T['items']>, 0>
  : never;

type MinItemsTupleSchema<T> = T extends { type: 'array'; items: any[]; minItems: number }
  ? AllTuples<MapTuple<T['items']>, T['minItems']>
  : never;

// 然后可以继续用上断路器，有了 minItems 就不能再做 SimpleTupleSchema 了
type TupleSchema<T> = ShortCircuited<[MinItemsTupleSchema<T>, SimpleTupleSchema<T>]>;
```

测试一下：

```TypeScript
const typedMinItemsTupleSchema = {
  type: 'array',
  items: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
  minItems: 2,
} as const;
Expect<
  Equal<Schema<typeof typedMinItemsTupleSchema>, [number, string] | [number, string, boolean]>
>();
```

然而并不能正常工作……调查一下原因，原来是因为这样写的 `MapTuple`:

```TypeScript
type MapTuple<T extends any[]> = { [K in keyof T]: WritableSchema<T[K]> };
```

映射出来的元组类型就没有 `length` 了！唉，不知道能不能算是 bug，不过反正我们有…………

**可变元组类型泛型！**

改用 TypeScript 4 的新方法：

```TypeScript
type MapTuple<T extends any[]> = T extends [...infer Heads, infer Tail]
  ? [...MapTuple<Heads>, WritableSchema<Tail>]
  : [];
```

Test cases 又恢复正常了。

## 额外元素类型

这样就结束了吗？结束了吗？？当然不是……

JSONSchema 的元组还有另一个定义：额外元素类型 `additionalItems`。这个元素有三种可能：

1. 未定义，在元组之外可以有任意多个 **any** 类型成员
2. 定义为 `false`， 则在元组之外没有任何成员
3. 定义为另一个 JSONSchema，在元组之外可以有任意多个该 JSONSchema 定义的类型成员

也就是说我们一直在做的就是第(2)种定义，现在还需要把第(2)和第(3)补上（而且同时还应该支持 `minItems`）。

上了各种组合，test case 一下变得复杂了很多：

```TypeScript
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
  additionalItems: { type: 'array', items: { type: string } },
} as const;
Expect<
  Equal<
    Schema<typeof typedAdditionalStringMinItemsTupleSchema>,
    [number, string] | [number, string, boolean] | [number, string, boolean, ...string[][]]
  >
>();
```

有了之前的经验，再做这个已经不难了（毕竟就是继续在 `extends` 后加东西）：

```TypeScript
// 上面的 TupleSchema 换个名字方便复用
type BasicTupleSchema<T> = ShortCircuited<[MinItemsTupleSchema<T>, SimpleTupleSchema<T>]>;

type NoAdditionalItemsTupleSchema<T> = T extends {
  type: 'array';
  items: any[];
  additionalItems: false; // 第 (2) 种情形，直接用上上面的 ShortCircuited 定义
}
  ? BasicTupleSchema<T>
  : never;

type TypedAdditionalItemsTupleSchema<T> = T extends {
  type: 'array';
  items: any[];
  additionalItems: any; // 第（3）种情形
}
  ? BasicTupleSchema<T> | [...MapTuple<T['items']>, ...WritableSchema<T['additionalItems']>[]]
  : never;

type AnyTypedAdditionalItemsTupleSchema<T> = T extends {
  type: 'array';
  items: any[];
  // 第 (1) 种情形，未定义 additionalItems 则是任意多个any类型
}
  ? BasicTupleSchema<T> | [...MapTuple<T['items']>, ...any[]]
  : never;

// TupleSchema 也还是需要短路的，毕竟三种类型都有冲突，注意
// AnyTypedAdditionalItemsTupleSchema 必须放最后
type TupleSchema<T> = ShortCircuited<
  [
    NoAdditionalItemsTupleSchema<T>,
    TypedAdditionalItemsTupleSchema<T>,
    AnyTypedAdditionalItemsTupleSchema<T>,
  ]
>;
```

这下我们终于支持了几乎所有元组和数组的特性。当然，JSONSchema 中还定义了 `contains`、`maxItems` (理论上可以做但不应该做，毕竟用泛型造几千个元组联合类型并不实际）、`uniqueItems` 这些要么无法实现要么成本太高的属性，这些还是留给 JSONSchema validator 吧。

本文总结：TypeScript 4 推出的可变元组类型非常强大，适当使用能有很多神奇的效果。

## 下一篇

下一篇文章让我们来尝试一下 JSONSchema 最有用的对象类型吧！

注：本文代码已上传至[GitHub 仓库](https://github.com/YuJianrong/jsonschema-ts-type)，欢迎 Fork 和提 PR，大家一起来做类型体操吧！

### 系列文章索引

- [TypeScript 泛型解析 JSONSchema（1）](https://zhuanlan.zhihu.com/p/375740178)
- [TypeScript 泛型解析 JSONSchema（2）](https://zhuanlan.zhihu.com/p/375918832)
- [TypeScript 泛型解析 JSONSchema（3）](https://zhuanlan.zhihu.com/p/376388589)
- [TypeScript 泛型解析 JSONSchema（4）](https://zhuanlan.zhihu.com/p/376943084)
- [TypeScript 泛型解析 JSONSchema（5）](https://zhuanlan.zhihu.com/p/376943197)
