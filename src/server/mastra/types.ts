import { z } from "zod";

import { PlayerId } from "~/drizzle/schema";
import { type AiPlayerConfig, aiPlayerConfigSchema } from "~/shared/@types";

export const serializedStateSchema = z.record(z.string(), z.unknown());

export const moveSchema = z.record(
	z.string(),
	z.union([z.number(), z.string(), z.boolean(), z.null(), z.undefined()]),
);

export const playerConfigMapSchema = z.object({
	[PlayerId.X]: aiPlayerConfigSchema.optional(),
	[PlayerId.O]: aiPlayerConfigSchema.optional(),
});

export type NormalizedPlayerConfigMap = Record<PlayerId, AiPlayerConfig | null>;

const normalizePlayerConfig = (
	config?: AiPlayerConfig | null,
): AiPlayerConfig | null => {
	if (!config) {
		return null;
	}

	return {
		model: config.model ?? null,
		prompt: config.prompt ?? null,
	};
};

export const normalizePlayerConfigMap = (
	map?: Partial<Record<PlayerId, AiPlayerConfig | null>>,
): NormalizedPlayerConfigMap => ({
	[PlayerId.X]: normalizePlayerConfig(map?.[PlayerId.X]),
	[PlayerId.O]: normalizePlayerConfig(map?.[PlayerId.O]),
});
