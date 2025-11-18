import "server-only";

import { Mastra } from "@mastra/core";
import { LangfuseExporter } from "@mastra/langfuse";

import { env } from "~/env";
import {
	MATCH_PLAY_WORKFLOW_ID,
	matchPlayWorkflow,
} from "./workflows/match-play.workflow";

let mastraInstance: Mastra | null = null;

function getMastraInstance(): Mastra {
	if (!mastraInstance) {
		const config: ConstructorParameters<typeof Mastra>[0] = {
			workflows: {
				[MATCH_PLAY_WORKFLOW_ID]: matchPlayWorkflow,
			},
		};

		// Only add observability if Langfuse env vars are set
		if (
			env.LANGFUSE_PUBLIC_KEY &&
			env.LANGFUSE_SECRET_KEY &&
			env.LANGFUSE_BASE_URL
		) {
			config.observability = {
				configs: {
					langfuse: {
						serviceName: "ai-leaderboard",
						exporters: [
							new LangfuseExporter({
								publicKey: env.LANGFUSE_PUBLIC_KEY,
								secretKey: env.LANGFUSE_SECRET_KEY,
								baseUrl: env.LANGFUSE_BASE_URL,
								options: {
									environment: env.NODE_ENV,
								},
							}),
						],
					},
				},
			};
		}

		mastraInstance = new Mastra(config);
	}

	return mastraInstance;
}

export function getMatchPlayWorkflow() {
	return getMastraInstance().getWorkflow(MATCH_PLAY_WORKFLOW_ID);
}
