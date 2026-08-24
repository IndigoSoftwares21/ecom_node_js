/**
 * Signals a failure that repeating cannot fix — an unsupported currency, a
 * malformed account, a rejected payload. The worker records the payout as FAILED
 * and drops the job instead of burning its retry budget.
 */
class NonRetryablePaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NonRetryablePaymentError";
    }
}

export default NonRetryablePaymentError;
