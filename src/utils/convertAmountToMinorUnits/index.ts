interface IConvertAmountToMinorUnits {
    amount: string;
    minorUnitExponent: number;
}

/**
 * Converts a decimal money string to minor units by shifting the decimal point
 * with string arithmetic.
 *
 * Deliberately never multiplies: `19.99 * 100` is 1998.9999999999998 in IEEE
 * 754, so arithmetic on the parsed float silently produces the wrong amount for
 * ordinary prices.
 *
 * Throws rather than rounding when the amount carries more precision than the
 * currency has, because quietly discarding a fraction of someone's money is
 * worse than refusing the request.
 */
const convertAmountToMinorUnits = ({
    amount,
    minorUnitExponent,
}: IConvertAmountToMinorUnits): number => {
    const [wholePart, fractionPart = ""] = amount.split(".");

    if (fractionPart.length > minorUnitExponent) {
        throw new RangeError(
            `Amount ${amount} has more decimal places than the currency supports (${minorUnitExponent})`,
        );
    }

    const shifted = `${wholePart}${fractionPart.padEnd(minorUnitExponent, "0")}`;

    const amountInMinorUnits = Number(shifted);

    if (!Number.isSafeInteger(amountInMinorUnits)) {
        throw new RangeError(
            `Amount ${amount} in minor units exceeds the safe integer range`,
        );
    }

    return amountInMinorUnits;
};

export default convertAmountToMinorUnits;
