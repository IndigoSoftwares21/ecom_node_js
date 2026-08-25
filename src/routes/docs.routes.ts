import { Router } from "express";
import DOCS from "@/constants/docs";
import buildOpenApiDocument from "@/docs/buildOpenApiDocument";
import renderScalarPage from "@/docs/renderScalarPage";

const router = Router();

router.get(DOCS.SPEC_PATH, (_req, res) => {
    res.json(buildOpenApiDocument());
});

router.get(DOCS.UI_PATH, (_req, res) => {
    res.type("html").send(renderScalarPage());
});

export default router;
