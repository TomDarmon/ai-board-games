import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { Anthropic } from "@anthropic-ai/sdk";
import { OpenAI } from "openai";
import { ApiProvider, userApiCredential } from "~/drizzle/schema";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { encryptSecret, maskKey } from "~/server/security/crypto";

export const aiRouter = createTRPCRouter({
	// List user's API credentials
	listCredentials: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const credentials = await ctx.db.query.userApiCredential.findMany({
			where: eq(userApiCredential.userId, userId),
			orderBy: [userApiCredential.provider],
			columns: {
				id: true,
				provider: true,
				apiKeyLast4: true,
				validatedAt: true,
				createdAt: true,
				updatedAt: true,
				encryptedApiKey: false,
			},
		});

		return credentials;
	}),

	// Validate and save an API key
	saveCredential: protectedProcedure
		.input(
			z.object({
				provider: z.enum([ApiProvider.OpenAI, ApiProvider.Anthropic]),
				apiKey: z.string().min(20),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { provider, apiKey } = input;

			// Validate the API key by testing it with the provider
			try {
				if (provider === ApiProvider.OpenAI) {
					const openaiClient = new OpenAI({ apiKey });
					await openaiClient.models.list();
				} else if (provider === ApiProvider.Anthropic) {
					const anthropicClient = new Anthropic({ apiKey });
					await anthropicClient.models.list();
				} else {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid provider: ${provider}`,
					});
				}
			} catch (error) {
				console.error(`Failed to validate ${provider} API key:`, error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Invalid ${provider} API key. Please check and try again.`,
				});
			}

			// Save the credential
			try {
				const now = new Date().toISOString();
				const encryptedKey = encryptSecret(apiKey, env.ENCRYPTION_KEY);
				const last4 = maskKey(apiKey);

				const existingCredential =
					await ctx.db.query.userApiCredential.findFirst({
						where: and(
							eq(userApiCredential.userId, userId),
							eq(userApiCredential.provider, provider),
						),
					});

				let credential: typeof userApiCredential.$inferSelect | undefined;
				if (existingCredential) {
					const updated = await ctx.db
						.update(userApiCredential)
						.set({
							encryptedApiKey: encryptedKey,
							apiKeyLast4: last4,
							validatedAt: now,
							updatedAt: now,
						})
						.where(
							and(
								eq(userApiCredential.userId, userId),
								eq(userApiCredential.provider, provider),
							),
						)
						.returning();

					credential = updated[0];
					if (!credential) {
						throw new Error("Failed to update credential");
					}
				} else {
					const created = await ctx.db
						.insert(userApiCredential)
						.values({
							userId,
							provider,
							encryptedApiKey: encryptedKey,
							apiKeyLast4: last4,
							validatedAt: now,
							createdAt: now,
							updatedAt: now,
						})
						.returning();

					credential = created[0];
					if (!credential) {
						throw new Error("Failed to create credential");
					}
				}

				return {
					id: credential.id,
					provider: credential.provider,
					apiKeyLast4: credential.apiKeyLast4,
					validatedAt: credential.validatedAt,
					createdAt: credential.createdAt,
					updatedAt: credential.updatedAt,
				};
			} catch (error) {
				console.error(`Failed to save ${provider} credential:`, error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to save ${provider} credential`,
				});
			}
		}),

	// Delete a credential
	deleteCredential: protectedProcedure
		.input(
			z.object({
				provider: z.enum([ApiProvider.OpenAI, ApiProvider.Anthropic]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { provider } = input;

			const deleted = await ctx.db
				.delete(userApiCredential)
				.where(
					and(
						eq(userApiCredential.userId, userId),
						eq(userApiCredential.provider, provider),
					),
				)
				.returning();
			const deletedRow = deleted[0];
			if (!deletedRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `No ${provider} credential found`,
				});
			}
			return {
				id: deletedRow.id,
				provider: deletedRow.provider,
			};
		}),
});
