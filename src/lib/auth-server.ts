import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "~/lib/auth";

/**
 * Get the current session from a React Server Component.
 * This is cached per request to avoid multiple database calls.
 */
export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return session;
});

/**
 * Get the current user from a React Server Component.
 * Returns null if not authenticated.
 */
export const getCurrentUser = cache(async () => {
	const session = await getSession();
	return session?.user ?? null;
});
