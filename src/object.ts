import type { ShortCircuited, WritableSchema } from './all';

type MergeIntersection<T> = { [K in keyof T]: T[K] };

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

export type ObjectSchema<T> = ShortCircuited<
  [NoAdditionalPropertiesObjectSchema<T>, AdditionalPropertiesObjectSchema<T>]
>;
