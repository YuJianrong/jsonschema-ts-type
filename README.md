# jsonschema-ts-type

This package provide a helper Type `Schema` which will covert the JSONSchema type into TypeScript type. Note the JSONSchema must be literal typed to make this helper Type `Schema` parse the Schema correctly, so the Schema must be stay in `.ts` file instead of `.json` file since the `.json` file will result in generic types like `string` or `number`.

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

## Contribution

Clone this repo and open it with VSCode, everything should be working properly. Please add the generic type in `src/index.ts` and add related test cases in `src/index.test.ts`.
