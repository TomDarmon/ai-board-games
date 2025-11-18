import "dotenv/config"; // make sure to install dotenv package
import { defineConfig } from "drizzle-kit";
import { env } from "./src/env.js";

export default defineConfig({
	dialect: "postgresql",
	out: "./src/drizzle",
	schema: "./src/drizzle/schema.ts",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	// Always ask for confirmation
	strict: true,
});
