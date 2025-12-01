import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { agentProfile, gameMatch } from "~/drizzle/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { AnthropicModels, MistralModels, OpenAIModels } from "~/shared/models";

// Create a tuple of all model values for zod enum
const allModelValues = [
	...Object.values(OpenAIModels),
	...Object.values(AnthropicModels),
	...Object.values(MistralModels),
] as const;

export const agentRouter = createTRPCRouter({
	// List all agents
	list: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const agents = await ctx.db.query.agentProfile.findMany({
			where: eq(agentProfile.userId, userId),
			orderBy: desc(agentProfile.createdAt),
			with: {
				gameMatches_playerXagentId: {
					where: eq(gameMatch.userId, userId),
				},
				gameMatches_playerOagentId: {
					where: eq(gameMatch.userId, userId),
				},
			},
		});

		// Transform to match frontend expectations
		return agents.map((agent) => ({
			...agent,
			_count: {
				matchesAsX: agent.gameMatches_playerXagentId.length,
				matchesAsO: agent.gameMatches_playerOagentId.length,
			},
		}));
	}),

	// Get single agent by ID
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			return ctx.db.query.agentProfile.findFirst({
				where: and(
					eq(agentProfile.id, input.id),
					eq(agentProfile.userId, userId),
				),
			});
		}),

	// Create new agent
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100),
				model: z.enum(allModelValues).optional(),
				prompt: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const result = await ctx.db
				.insert(agentProfile)
				.values({
					name: input.name,
					model: input.model,
					prompt: input.prompt,
					userId,
				})
				.returning();
			return result[0];
		}),

	// Update existing agent
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(100).optional(),
				model: z.enum(allModelValues).optional(),
				prompt: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { id, ...data } = input;
			const result = await ctx.db
				.update(agentProfile)
				.set(data)
				.where(and(eq(agentProfile.id, id), eq(agentProfile.userId, userId)))
				.returning();
			return result[0];
		}),

	// Delete agent
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const result = await ctx.db
				.delete(agentProfile)
				.where(
					and(eq(agentProfile.id, input.id), eq(agentProfile.userId, userId)),
				)
				.returning();
			return result[0];
		}),
});
