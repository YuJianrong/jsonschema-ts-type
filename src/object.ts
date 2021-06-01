import type { ShortCircuited, WritableSchema } from './all';

type MergeIntersection<T> = { [K in keyof T]: T[K] };

type OptionalObjectSchema<T, AdditionalProperties, S> = T extends {
  type: 'object';
  properties: infer P;
}
  ? AdditionalProperties extends false
    ? { [K in keyof P]?: WritableSchema<P[K], S> }
    : MergeIntersection<{ [K in keyof P]?: WritableSchema<P[K], S> } & Record<string, unknown>>
  : never;

type RequiredObjectSchema<T, AdditionalProperties, S> = T extends {
  type: 'object';
  properties: infer P;
  required: string[];
}
  ? AdditionalProperties extends false
    ? MergeIntersection<
        { [K in Extract<keyof P, T['required'][number]>]: WritableSchema<P[K], S> } &
          { [K in Exclude<keyof P, T['required'][number]>]?: WritableSchema<P[K], S> }
      >
    : MergeIntersection<
        { [K in Extract<keyof P, T['required'][number]>]: WritableSchema<P[K], S> } &
          { [K in Exclude<keyof P, T['required'][number]>]?: WritableSchema<P[K], S> } &
          Record<string, unknown>
      >
  : never;

type PropertiesOnlyObjectSchema<T, AdditionalProperties, S> = ShortCircuited<
  [
    RequiredObjectSchema<T, AdditionalProperties, S>,
    OptionalObjectSchema<T, AdditionalProperties, S>,
  ]
>;

type NoAdditionalPropertiesObjectSchema<T, S> = T extends {
  type: 'object';
  properties: any;
  additionalProperties: false;
}
  ? PropertiesOnlyObjectSchema<T, false, S>
  : never;

type AdditionalPropertiesObjectSchema<T, S> = PropertiesOnlyObjectSchema<T, true, S>;

export type ObjectSchema<T, S> = ShortCircuited<
  [NoAdditionalPropertiesObjectSchema<T, S>, AdditionalPropertiesObjectSchema<T, S>]
>;
