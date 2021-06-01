#! https://zhuanlan.zhihu.com/p/376943197

# TypeScript 泛型解析 JSONSchema（5）

系列文章进入第五篇，前面几篇我们处理了 JSONSchema 常见的各种特性，这一篇我们来尝试一下棘手的 `$ref`。

## 为什么棘手

首先介绍一下 `$ref`，`$ref` 是用于引用定义在另一个地方的 JSONSchema，比如 `"#/definitions/address"` 意思就是“使用 `/definitions/address` 这个位置的 JSONSchema 来表示该类型。那么为什么 `$ref` 棘手呢？原因在于：

1. `$ref` 是字符串
2. `$ref` 的指向是绝对路径，我们用了很多递归，在递归解析到内部 JSONSchema 的时候，已经定位不到全局 JSONSchema 了

## 模板字符串

那么这是不是能解决呢？当然是可以的……

1. TypeScript 4 之后出现了神奇的字符串模板类型，简直就是为了解析这种字符串而生的
2. 只要我们在 Schema 中也传入全局 JSONSchema （只用于处理 `$ref`），就能准确找到要找的目标了

那么就开始吧！首先当然还是 test case

```TypeScript
// 结合 anyOf 和 $ref
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

// 也试试嵌套的 $ref, 甚至二次 $ref
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
```

首先，还是和之前一样来提取 `$ref`，介于 `$ref` 总是开始于 `#/`，我们也顺便把这个 `#/` 去掉，方便之后的操作。这只要通过 `infer` 和模板字符串类型就可以轻松做到:

```TypeScript
export type RefSchema<T, S> = T extends {
  $ref: `#/${infer Path}`;
}
  ? Definitions<S, Path, S>
  : never;
```

注意这里引入了第二个模板参数 `S`，这个参数 `S` 就是用来一直保存全局 JSONSchema。 `T` 只用于取得 `Path`，我们并不需要 `T` 来寻找 Schema，只需要全局 JSONSchema `S` 就够了。

然后就是怎么写 `Definitions` 这个模板了，注意到拿掉 `#/` 的 `$ref` 是这样的结构：

```JSON
"namespace1/namespace2/schema"
```

**（注意： `$ref` 是可以多层嵌套的）**

那么很容易想到写一个递归来找到最后的部分：

```TypeScript
type Definitions<Path extends string> =
  Path extends `${infer Namespace}/${infer Rest}`
    ? Definitions<Rest>
    : Path;
// Definitions<'a/b/c/dede'> 将获得类型 'dede'
```

然后再结合 `WritableSchema<>` 和之前的全局 JSONSchema，就可以写出来了：

```TypeScript
type Definitions<T extends Record<string, any>, Path extends string, S> =
  Path extends `${infer Namespace}/${infer Rest}`
    ? Definitions<T[Namespace], Rest, S>
    : WritableSchema<T[Path], S>;
```

这里可以看到为什么我们既需要 `T`、又需要 `S`， `T` 是当前递归提取的定义，而 `S` 是全局 JSONSchema，如果 `$ref` 出现嵌套，就也需要另一个全局 JSONSchema 来继续寻找下一个 `$ref` 所对应的 Schema。

从这里出发，以前的 `WritableSchema` 要改写成这样：

```TypeScript
export type WritableSchema<T, S> = ShortCircuited<
  [
    RefSchema<T, S>,
    ConstSchema<T>,
    EnumSchema<T>,
    AnyOfSchema<T, S>,
    ObjectSchema<T, S>,
    TupleSchema<T, S>,
    TypedArraySchema<T, S>,
    BasicSchema<T>,
  ]
>;
```

注意除了 `ConstSchema`、`EnumSchema` 和 `BasicSchema` 外，其他模板都需要递归调用 `WritableSchema`，所以也是需要传入 `S` 的，所以所有之前写过的 Schema 都要改造来加入这个新的参数 `S` ，这是非常简单又机械的操作，我这里就不展开了。

而我们对外暴露的 `Schema` 也要相应地改写为：

```TypeScript
export type Schema<T> = WritableSchema<DeepWriteable<T>, DeepWriteable<T>>;
```

连续做两次 `DeepWriteable<T>` 多难看，来我们用 `extends`/`infer` 改造一下：

```TypeScript
export type Schema<T> = DeepWriteable<T> extends infer S ? WritableSchema<S, S> : never;
```

test case 全部通过！大功告成！

最后看看 VSCode 的结果：

![JSONSchema $Ref](https://pic4.zhimg.com/80/v2-49140be9964a92d7af9c3974222068be.png)

## 小结

经过这一系列文章的尝试，我们成功地使用 TypeScript 的模板特性解析了大多数 JSONSchema，当然还有一些复杂的特性无法用模板来做到（它们有些可以通过工具 [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript) 转化为合法的 TypeScript 类型，有些这个工具也是无法转化的），但这也充分证明了 TypeScript 类型系统的强大。虽然这一系列文章可能并没有用于实际生产的意义，但也希望它们能帮助你更深入地理解 TypeScript 的类型系统，更好地应用到自己的项目中去。

谢谢阅读！

注：本文代码已上传至[GitHub 仓库](https://github.com/YuJianrong/jsonschema-ts-type)，欢迎 Fork 和提 PR，大家一起来做类型体操吧！

### 系列文章索引

- [TypeScript 泛型解析 JSONSchema（1）](https://zhuanlan.zhihu.com/p/375740178)
- [TypeScript 泛型解析 JSONSchema（2）](https://zhuanlan.zhihu.com/p/375918832)
- [TypeScript 泛型解析 JSONSchema（3）](https://zhuanlan.zhihu.com/p/376388589)
- [TypeScript 泛型解析 JSONSchema（4）](https://zhuanlan.zhihu.com/p/376943084)
- [TypeScript 泛型解析 JSONSchema（5）](https://zhuanlan.zhihu.com/p/376943197)
