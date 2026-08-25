import express from "express";
import type { Server } from "http";
import { disconnect } from "@/database";
import appRoutes from "@/routes/app.routes";
import docsRoutes from "@/routes/docs.routes";

import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import monitoring from "./utils/monitoring";
const corsOptions = {
    origin: [process.env.CORS_ORIGIN || "http://localhost:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
};

class App {
    public express: express.Application;

    private server?: Server;

    constructor() {
        this.express = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.express.set("trust proxy", 1);
    }

    private initializeMiddlewares(): void {
        // Mounted ahead of the security headers: Scalar loads its bundle from a
        // CDN, which both helmet's default policy and the stricter header below
        // would block, leaving a blank page. Only the documentation routes are
        // served without them.
        this.express.use(docsRoutes);

        this.express.use(cors(corsOptions));
        this.express.use(express.json());
        this.express.use(helmet());
        this.express.use(helmet.xssFilter());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use((_req, res, next) => {
            res.setHeader("Content-Security-Policy", "default-src 'self'");
            res.setHeader("Strict-Transport-Security", "max-age=31536000");
            next();
        });
        this.express.use((req, res, next) => {
            monitoring.info(`${req.method} ${req.path}`);
            next();
        });

        if (process.env.APP_ENVIRONMENT === "PRODUCTION") {
            // 30 requests per minute per IP
            const limiter = rateLimit({
                windowMs: 1 * 60 * 1000,
                max: 60,
            });
            this.express.use(limiter);
        }
    }

    private initializeRoutes(): void {
        monitoring.info("Initializing routes");

        const apiVersion = process.env.API_VERSION || "v1";

        // Register route modules here
        this.express.use(`/api/${apiVersion}`, appRoutes);
        monitoring.info(`Registered route: /api/${apiVersion}`);
    }

    public async start(port: number): Promise<void> {
        try {
            dotenv.config();
            this.server = this.express.listen(port, () => {
                monitoring.info(`Server running on port ${port}`);
            });
        } catch (error) {
            monitoring.error("Failed to start server:", error as Error);
            await disconnect();
            process.exit(1);
        }
    }

    /**
     * Stops accepting connections. Separate from stop() because an open listener
     * keeps the process alive, and callers that manage the database pool
     * themselves need to release the port without closing it.
     */
    public async closeServer(): Promise<void> {
        await new Promise<void>((resolve) => {
            if (!this.server) {
                resolve();

                return;
            }

            this.server.close(() => resolve());
        });
    }

    public async stop(): Promise<void> {
        await this.closeServer();
        await disconnect();
    }
}

const app = new App();

app.start(parseInt(process.env.PORT || "7070", 10));

export default app;
