const REGEX_PATTERNS = {
    /** Letters, spaces, hyphens and apostrophes, covering names like O'Neill. */
    PERSON_NAME: /^[a-zA-Z\s'-]+$/,
    BANK_CODE: /^[0-9]{3,6}$/,
    BANK_ACCOUNT_NUMBER: /^[0-9]{10,20}$/,
    /** Money in major units: up to four decimal places, the ISO 4217 maximum. */
    DECIMAL_AMOUNT: /^(0|[1-9][0-9]{0,14})(\.[0-9]{1,4})?$/,
} as const;

export default REGEX_PATTERNS;
