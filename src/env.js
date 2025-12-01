import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		LANGFUSE_PUBLIC_KEY: z.string().optional(),
		LANGFUSE_SECRET_KEY: z.string().optional(),
		LANGFUSE_BASE_URL: z.string().optional(),
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_URL: z.string().optional(),
		RESEND_API_KEY: z.string(),
		ENCRYPTION_KEY: z.string(),
		VERCEL_URL: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BETTER_AUTH_URL: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
		LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
		LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`
			: "http://localhost:3000",
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
		VERCEL_URL: process.env.VERCEL_URL,
		NEXT_PUBLIC_BETTER_AUTH_URL: process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`
			: "http://localhost:3000",
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
