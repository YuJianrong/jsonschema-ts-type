/* eslint-disable @typescript-eslint/no-empty-function */

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

export function Expect<T extends true>(): T | void {}

export function ExpectNot<T extends false>(): T | void {}

Expect<Equal<false, false>>();
ExpectNot<Equal<false, true>>();

Expect<Equal<any, any>>();
ExpectNot<Equal<undefined, any>>();
ExpectNot<Equal<null, any>>();
ExpectNot<Equal<string, any>>();
ExpectNot<Equal<undefined, null>>();
