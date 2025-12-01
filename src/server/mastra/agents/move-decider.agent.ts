import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { and, eq } from "drizzle-orm";
import {
	ApiProvider,
	GameType,
	PlayerId,
	userApiCredential,
} from "~/drizzle/schema";
import { getMoveSchema } from "~/server/ai/move-schemas";
import { getPromptFormatter } from "~/server/ai/prompt-helpers";
import type { db } from "~/server/db";
import type { Move } from "~/server/games";
import { decryptSecret } from "~/server/security/crypto";
import { aiPlayerConfigSchema } from "~/shared/@types";
import { getProviderForModel } from "~/shared/models";
import { moveSchema, serializedStateSchema } from "../types";

type Database = typeof db;

const moveDeciderInputSchema = z.object({
	gameType: z.enum(GameType),
	state: serializedStateSchema,
	legalMoves: z.array(moveSchema).min(1, "At least one legal move is required"),
	player: z.enum(PlayerId),
	playerConfig: aiPlayerConfigSchema,
	userId: z.string(),
});

const moveDeciderOutputSchema = z.object({
	move: moveSchema,
	prompt: z.string(),
	rawResponse: z.unknown(),
});

type MoveDeciderInput = z.infer<typeof moveDeciderInputSchema>;
type MoveDeciderOutput = z.infer<typeof moveDeciderOutputSchema>;

export async function decideMove(
	input: MoveDeciderInput,
	db: Database,
): Promise<MoveDeciderOutput> {
	const { gameType, state, legalMoves, player, playerConfig, userId } = input;

	const promptFormatter = getPromptFormatter(gameType);
	// Always use the structured prompt formatter as the base (contains board state, legal moves, format)
	const structuredPrompt = promptFormatter(state, legalMoves, player);

	// Add player-specific or shared strategy guidance if provided
	const strategyGuidance = playerConfig.prompt;
	const basePrompt = strategyGuidance
		? `${strategyGuidance}\n\n${structuredPrompt}`
		: structuredPrompt;

	const prompt = basePrompt;

	const modelName = playerConfig?.model;
	if (!modelName) {
		throw new Error("Model name is required");
	}

	// Determine the correct provider based on the model name
	const provider = getProviderForModel(modelName);

	const credential = await db.query.userApiCredential.findFirst({
		where: and(
			eq(userApiCredential.userId, userId),
			eq(userApiCredential.provider, provider),
		),
		columns: {
			encryptedApiKey: true,
		},
	});

	if (!credential) {
		throw new Error(
			`No API credential found for ${provider} and user ${userId}`,
		);
	}

	const userApiKey = decryptSecret(credential.encryptedApiKey);

	// Create client with the appropriate API key based on provider
	const getModel = () => {
		switch (provider) {
			case ApiProvider.OpenAI: {
				const openai = createOpenAI({ apiKey: userApiKey });
				return openai(modelName);
			}
			case ApiProvider.Anthropic: {
				const anthropic = createAnthropic({ apiKey: userApiKey });
				return anthropic(modelName);
			}
			case ApiProvider.Mistral: {
				const mistral = createMistral({ apiKey: userApiKey });
				return mistral(modelName);
			}
			default:
				throw new Error(`Unsupported provider: ${provider}`);
		}
	};

	const model = getModel();

	const schema = getMoveSchema(gameType);

	const generationOptions = {
		providerOptions: {
			openai: {
				reasoningEffort: "minimal",
			},
			anthropic: {
				thinking: { type: "disabled" }, // 1024 is the minimum budget tokens for thinking to be enabled
			},
		},
	};

	const result = await generateObject({
		model,
		prompt,
		schema,
		...generationOptions,
	});

	return {
		move: result.object as Move,
		prompt,
		rawResponse: result.object,
	};
}
