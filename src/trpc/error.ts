import { TRPCClientError } from "@trpc/client";

import type { AppRouter } from "~/server/api/root";

type FlattenedZodError = {
	fieldErrors?: Record<string, (string | undefined)[] | undefined>;
	formErrors?: (string | undefined)[];
};

const FALLBACK_MESSAGE = "An unexpected error occurred.";

function extractZodMessage(error: TRPCClientError<AppRouter>) {
	const zodError = error.data?.zodError as FlattenedZodError | null | undefined;

	if (!zodError) return null;

	for (const values of Object.values(zodError.fieldErrors ?? {})) {
		if (!values) continue;
		for (const message of values) {
			if (message) {
				return message;
			}
		}
	}

	for (const formError of zodError.formErrors ?? []) {
		if (formError) {
			return formError;
		}
	}

	return null;
}

export function getTRPCErrorMessage(
	error: unknown,
	fallbackMessage = FALLBACK_MESSAGE,
) {
	if (error instanceof TRPCClientError) {
		return extractZodMessage(error) ?? error.message ?? fallbackMessage;
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallbackMessage;
}
