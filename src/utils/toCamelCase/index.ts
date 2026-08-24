// Must stay identical to Kysely's CamelCasePlugin mapper, which is not importable.
export const toCamelCase = (identifier: string): string => {
    if (!identifier.length) {
        return identifier;
    }

    let output = identifier[0];

    for (let index = 1; index < identifier.length; index += 1) {
        const character = identifier[index];

        if (character === "_") {
            continue;
        }

        output +=
            identifier[index - 1] === "_"
                ? character.toUpperCase()
                : character;
    }

    return output;
};

export default toCamelCase;
