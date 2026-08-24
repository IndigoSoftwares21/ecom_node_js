const REGEX_PATTERNS = {
    /** Letters, spaces, hyphens and apostrophes, covering names like O'Neill. */
    PERSON_NAME: /^[a-zA-Z\s'-]+$/,
    BANK_CODE: /^[0-9]{3,6}$/,
    BANK_ACCOUNT_NUMBER: /^[0-9]{10,20}$/,
} as const;

export default REGEX_PATTERNS;
