const DOCS = {
    UI_PATH: "/docs",
    SPEC_PATH: "/openapi.json",
    TITLE: "Achievements, Badges and Cashback API",
    VERSION: "1.0.0",
    // Scalar's standalone bundle. Loaded from a CDN, which is why the docs
    // routes are mounted ahead of the Content-Security-Policy headers.
    SCALAR_CDN_URL: "https://cdn.jsdelivr.net/npm/@scalar/api-reference",
} as const;

export default DOCS;
