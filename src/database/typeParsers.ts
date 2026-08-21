import { types } from "pg";

const PG_INT8_OID = 20;

/**
 * pg returns int8 as a string to avoid silent precision loss. Every BIGINT here
 * is a money amount in minor units, well inside the safe integer range, so it
 * is parsed to a number and throws rather than lose precision if that changes.
 */
export const registerTypeParsers = (): void => {
    types.setTypeParser(PG_INT8_OID, (value: string): number => {
        const parsed = Number(value);

        if (!Number.isSafeInteger(parsed)) {
            throw new Error(
                `int8 value ${value} exceeds Number.MAX_SAFE_INTEGER and cannot be parsed safely`,
            );
        }

        return parsed;
    });
};

export default registerTypeParsers;
