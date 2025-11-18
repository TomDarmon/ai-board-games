/**
 * AI Model definitions and types
 */

import { ApiProvider } from "~/drizzle/schema";

// OpenAI Models as const object for direct string usage
export const OpenAIModels = {
	GPT5: "gpt-5",
	GPT5Mini: "gpt-5-mini",
	GPT5Nano: "gpt-5-nano",
	GPT5Codex: "gpt-5-codex",
	GPT41: "gpt-4.1",
	GPT41Mini: "gpt-4.1-mini",
	GPT41Nano: "gpt-4.1-nano",
	GPT4o: "gpt-4o",
	GPT4oMini: "gpt-4o-mini",
} as const;

// Anthropic Models as const object for direct string usage
export const AnthropicModels = {
	ClaudeHaiku45: "claude-haiku-4-5",
	ClaudeSonnet45: "claude-sonnet-4-5",
	ClaudeOpus41: "claude-opus-4-1",
	ClaudeOpus40: "claude-opus-4-0",
	ClaudeSonnet40: "claude-sonnet-4-0",
	Claude37SonnetLatest: "claude-3-7-sonnet-latest",
	Claude35HaikuLatest: "claude-3-5-haiku-latest",
} as const;

// Union type of all model values
export type AIModel =
	| (typeof OpenAIModels)[keyof typeof OpenAIModels]
	| (typeof AnthropicModels)[keyof typeof AnthropicModels];

const ModelDisplayNames: Record<AIModel, string> = {
	[OpenAIModels.GPT5]: "GPT-5",
	[OpenAIModels.GPT5Mini]: "GPT-5 Mini",
	[OpenAIModels.GPT5Nano]: "GPT-5 Nano",
	[OpenAIModels.GPT5Codex]: "GPT-5 Codex",
	[OpenAIModels.GPT41]: "GPT-4.1",
	[OpenAIModels.GPT41Mini]: "GPT-4.1 Mini",
	[OpenAIModels.GPT41Nano]: "GPT-4.1 Nano",
	[OpenAIModels.GPT4o]: "GPT-4o",
	[OpenAIModels.GPT4oMini]: "GPT-4o Mini",
	[AnthropicModels.ClaudeHaiku45]: "Claude Haiku 4.5",
	[AnthropicModels.ClaudeSonnet45]: "Claude Sonnet 4.5",
	[AnthropicModels.ClaudeOpus41]: "Claude Opus 4.1",
	[AnthropicModels.ClaudeOpus40]: "Claude Opus 4.0",
	[AnthropicModels.ClaudeSonnet40]: "Claude Sonnet 4.0",
	[AnthropicModels.Claude37SonnetLatest]: "Claude 3.7 Sonnet",
	[AnthropicModels.Claude35HaikuLatest]: "Claude 3.5 Haiku",
};

const ModelDescriptions: Record<AIModel, string> = {
	[OpenAIModels.GPT5]: "Next-generation flagship model for complex tasks",
	[OpenAIModels.GPT5Mini]: "Efficient mid-tier model with strong performance",
	[OpenAIModels.GPT5Nano]: "Ultra-lightweight model for fast inference",
	[OpenAIModels.GPT5Codex]:
		"Specialized model for code generation and understanding",
	[OpenAIModels.GPT41]: "Enhanced GPT-4 model with improved reasoning",
	[OpenAIModels.GPT41Mini]:
		"Compact version of GPT-4.1 for efficient deployment",
	[OpenAIModels.GPT41Nano]:
		"Smallest GPT-4.1 variant for resource-constrained environments",
	[OpenAIModels.GPT4o]: "Most capable OpenAI model, great for complex strategy",
	[OpenAIModels.GPT4oMini]: "Fast and efficient, good for quick matches",
	[AnthropicModels.ClaudeHaiku45]:
		"Fast and cost-effective model for lightweight tasks",
	[AnthropicModels.ClaudeSonnet45]:
		"Balanced performance model for general use",
	[AnthropicModels.ClaudeOpus41]:
		"Advanced reasoning model for complex problem solving",
	[AnthropicModels.ClaudeOpus40]: "Flagship model with superior capabilities",
	[AnthropicModels.ClaudeSonnet40]: "Versatile model for strategic thinking",
	[AnthropicModels.Claude37SonnetLatest]:
		"Latest iteration with enhanced sonnet capabilities",
	[AnthropicModels.Claude35HaikuLatest]:
		"Optimized lightweight model for quick responses",
};

export function getModelDisplayName(model: string | null | undefined): string {
	if (!model) return "Default";
	return ModelDisplayNames[model as AIModel] ?? model;
}

export function getOpenAIModelsList(): AIModel[] {
	return Object.values(OpenAIModels);
}

export function getAnthropicModelsList(): AIModel[] {
	return Object.values(AnthropicModels);
}

export function getProviderDisplayName(provider: ApiProvider): string {
	switch (provider) {
		case ApiProvider.OpenAI:
			return "OpenAI";
		case ApiProvider.Anthropic:
			return "Anthropic";
		default:
			return provider;
	}
}

export function getProviderForModel(modelName: string): ApiProvider {
	const openAIModelValues = Object.values(OpenAIModels) as string[];
	const anthropicModelValues = Object.values(AnthropicModels) as string[];

	if (openAIModelValues.includes(modelName)) {
		return ApiProvider.OpenAI;
	}

	if (anthropicModelValues.includes(modelName)) {
		return ApiProvider.Anthropic;
	}

	throw new Error(`Unknown model provider for model: ${modelName}`);
}
