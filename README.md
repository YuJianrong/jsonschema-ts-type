# jsonschema-ts-type

This package provide a helper Type `Schema` which will covert the JSONSchema type into TypeScript type. Note the JSONSchema must be literal typed to make this helper Type `Schema` to be able to parse the Schema correctly, the JSONSchema must stay in `.ts` file and followed `as const` instead of `.json` file since the `.json` file will result in generic types like `string` or `number`.

## Difference compared to [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript)?

**This package have no running code!** It's just a TypeScript generic type which will convert the JSONSchema from literal typed JSON to a TypeScript type. By using [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript), The JSONSchema is converted to `.d.ts` from CLI or programmatically way, by using this package, the JSONSchema definitions stay in the `.ts` file and the type is converted by TypeScript generic typing system.

## Should I use this one instead of [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript)?

If you have been using [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript) in your project already, you should continue use it since it's much more reliable. If it's new to your project you may try this one, but use it **at your own risk**, it may be broken on complex JSONSchema since it costs too much for the TypeScript compiler. Again, [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript) is more reliable.

## How to use

This package can be used like this:

```TypeScript
import {Schema} from 'jsonschema-ts-type';

const schemaObj = {
  description: 'Any validation failures are shown in the right-hand Messages pane.',
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
} as const; // Note: `as const` is required to turn the type into literal type

type TypeObj = Schema<typeof schemaObj>;
// The TypeObj will be {foo?: number; bar?: "a" | "b" | "c"}
```

## Which JSONSchema features are supported

The following features of JSONSchema are supported to be converted into TypeScript Type:

- Primitive type (not the limitation like `minium`, `pattern` cannot be applied).
- Array Type (both generic array and Tuple, but `contains`, `minItems`, `maxItems` and `uniqueItems` are not supported)
- Object Type (`patternProperties` are not supported, `additionalProperties` cannot be parsed to specific type, name, size and dependencies are also not supported)
- Enumerated values and constant value
- `anyOf` combination keyword, note `allOf`, `oneOf` and `not` are not supported
- `$ref`, note only absolute path is supported, URI pattern (`"definitions.json#/address"`) and `id` based location (`"$ref": "#address"`) are not supported

## Contribution

Clone this repo and open it with VSCode, everything should be working properly. Please add the generic type in `src` folder and add related test cases in `test` folder.
