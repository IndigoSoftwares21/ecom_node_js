import convertAmountToMinorUnits from ".";

const NGN_EXPONENT = 2;

const JPY_EXPONENT = 0;

const KWD_EXPONENT = 3;

const toMinor = (amount: string, minorUnitExponent = NGN_EXPONENT) =>
    convertAmountToMinorUnits({ amount, minorUnitExponent });

describe("convertAmountToMinorUnits", () => {
    it.each([
        ["300", 30000],
        ["300.00", 30000],
        ["300.5", 30050],
        ["300.50", 30050],
        ["0.01", 1],
        ["0", 0],
        ["0.00", 0],
    ])("converts %s naira to %i kobo", (amount, expected) => {
        expect(toMinor(amount)).toBe(expected);
    });

    // Amounts where multiplying the parsed float drifts: 19.99 * 100 is
    // 1998.9999999999998, and 8.29 * 100 is 828.9999999999999.
    it.each([
        ["19.99", 1999],
        ["8.29", 829],
        ["1.10", 110],
        ["2.03", 203],
        ["4.35", 435],
    ])("converts %s to exactly %i, where multiplying would drift", (amount, expected) => {
        expect(toMinor(amount)).toBe(expected);
    });

    it("avoids drift that float multiplication would introduce", () => {
        expect(toMinor("19.99")).toBe(1999);
        expect(19.99 * 100).not.toBe(1999);

        expect(toMinor("8.29")).toBe(829);
        expect(8.29 * 100).not.toBe(829);
    });

    it("handles a currency with no minor unit", () => {
        expect(toMinor("300", JPY_EXPONENT)).toBe(300);
    });

    it("handles a currency with three minor digits", () => {
        expect(toMinor("1.5", KWD_EXPONENT)).toBe(1500);
        expect(toMinor("1.234", KWD_EXPONENT)).toBe(1234);
        // Three places are valid here and rejected for naira.
        expect(toMinor("1.005", KWD_EXPONENT)).toBe(1005);
        expect(() => toMinor("1.005", NGN_EXPONENT)).toThrow(RangeError);
    });

    it("refuses more precision than the currency has rather than rounding", () => {
        expect(() => toMinor("300.555")).toThrow(RangeError);
        expect(() => toMinor("300.5", JPY_EXPONENT)).toThrow(RangeError);
    });

    it("refuses an amount too large to represent safely", () => {
        expect(() => toMinor("99999999999999999999")).toThrow(RangeError);
    });
});
