/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	// Logging to help debug deployment issues
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
};

export default config;
