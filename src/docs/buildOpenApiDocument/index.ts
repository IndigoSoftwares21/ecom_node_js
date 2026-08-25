import DOCS from "@/constants/docs";
import components from "@/docs/components";
import userPaths from "@/docs/paths/userPaths";
import achievementPaths from "@/docs/paths/achievementPaths";
import productPurchasePaths from "@/docs/paths/productPurchasePaths";
import payoutRecipientPaths from "@/docs/paths/payoutRecipientPaths";

/**
 * Composes the specification from one file per resource, so adding an endpoint
 * means adding a paths file and one line here rather than editing a single large
 * document.
 */
const buildOpenApiDocument = () => {
    const apiVersion = process.env.API_VERSION ?? "v1";

    return {
        openapi: "3.0.3",
        info: {
            title: DOCS.TITLE,
            version: DOCS.VERSION,
            description:
                "Customers unlock achievements as they purchase, achievements earn badges, and each badge pays a cashback through a local payment provider.",
        },
        servers: [{ url: `/api/${apiVersion}` }],
        tags: [
            { name: "Users" },
            { name: "Product purchases" },
            { name: "Achievements" },
            { name: "Payout recipients" },
        ],
        paths: {
            ...userPaths,
            ...achievementPaths,
            ...productPurchasePaths,
            ...payoutRecipientPaths,
        },
        components,
    };
};

export default buildOpenApiDocument;
