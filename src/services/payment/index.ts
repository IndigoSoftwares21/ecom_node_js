import monitoring from "@/utils/monitoring";
import PaystackPaymentProvider from "./paystack";
import FakePaymentProvider from "./fake";
import type { IPaymentProvider } from "./types";

let paymentProvider: IPaymentProvider | undefined;

/**
 * Falls back to the fake provider when no secret key is present, so the cashback
 * path runs end to end in tests and local development. Production supplies
 * PAYSTACK_SECRET_KEY and gets the real client.
 */
const resolvePaymentProvider = (): IPaymentProvider => {
    if (paymentProvider) {
        return paymentProvider;
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (secretKey) {
        paymentProvider = new PaystackPaymentProvider(secretKey);
    } else {
        monitoring.warn(
            "PAYSTACK_SECRET_KEY is not set; using the fake payment provider",
        );
        paymentProvider = new FakePaymentProvider();
    }

    return paymentProvider;
};

export default resolvePaymentProvider;
