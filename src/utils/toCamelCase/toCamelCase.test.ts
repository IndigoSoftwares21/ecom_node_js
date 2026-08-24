import toCamelCase from ".";

describe("toCamelCase", () => {
    it.each([
        ["achievement_key", "achievementKey"],
        ["required_product_purchase_count", "requiredProductPurchaseCount"],
        ["amount_in_minor_units", "amountInMinorUnits"],
        ["iso_alpha_2_code", "isoAlpha2Code"],
    ])("converts %s to %s", (identifier, expected) => {
        expect(toCamelCase(identifier)).toBe(expected);
    });

    it("leaves an identifier with no underscores untouched", () => {
        expect(toCamelCase("currencies")).toBe("currencies");
        expect(toCamelCase("iso2")).toBe("iso2");
    });

    it("returns an empty string unchanged", () => {
        expect(toCamelCase("")).toBe("");
    });

    // The cases below are where a naive /_([a-z])/g replacement diverges from
    // Kysely's mapper. The generated database types must match the keys
    // CamelCasePlugin produces at runtime, so these behaviours are load-bearing
    // rather than incidental.
    it("uppercases a digit-adjacent character after an underscore", () => {
        expect(toCamelCase("iso_2_code")).toBe("iso2Code");
    });

    it("collapses repeated underscores rather than keeping one", () => {
        expect(toCamelCase("a__b")).toBe("aB");
    });

    it("drops a trailing underscore", () => {
        expect(toCamelCase("trailing_")).toBe("trailing");
    });

    it("keeps a leading underscore and uppercases what follows it", () => {
        expect(toCamelCase("_leading")).toBe("_Leading");
    });

    it("uppercases an already-uppercase character after an underscore", () => {
        expect(toCamelCase("all_CAPS")).toBe("allCAPS");
    });
});
