import DOCS from "@/constants/docs";

/**
 * Renders Scalar's standalone embed rather than using its Express middleware,
 * which ships ESM only and cannot be required from this CommonJS build.
 */
const renderScalarPage = (): string => `<!doctype html>
<html>
    <head>
        <title>${DOCS.TITLE}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <script id="api-reference" data-url="${DOCS.SPEC_PATH}"></script>
        <script src="${DOCS.SCALAR_CDN_URL}"></script>
    </body>
</html>`;

export default renderScalarPage;
