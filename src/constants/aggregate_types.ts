const AGGREGATE_TYPES = {
    APP_USER: "APP_USER",
} as const;

export type AggregateType =
    (typeof AGGREGATE_TYPES)[keyof typeof AGGREGATE_TYPES];

export default AGGREGATE_TYPES;
