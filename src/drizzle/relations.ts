import { relations } from "drizzle-orm/relations";
import {
	account,
	agentProfile,
	gameMatch,
	gameTurn,
	session,
	user,
} from "./schema";

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
	gameMatches: many(gameMatch),
	agentProfiles: many(agentProfile),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const gameTurnRelations = relations(gameTurn, ({ one }) => ({
	gameMatch: one(gameMatch, {
		fields: [gameTurn.matchId],
		references: [gameMatch.id],
	}),
}));

export const gameMatchRelations = relations(gameMatch, ({ one, many }) => ({
	gameTurns: many(gameTurn),
	user: one(user, {
		fields: [gameMatch.userId],
		references: [user.id],
	}),
	playerXAgent: one(agentProfile, {
		fields: [gameMatch.playerXagentId],
		references: [agentProfile.id],
		relationName: "gameMatch_playerXagentId_agentProfile_id",
	}),
	playerOAgent: one(agentProfile, {
		fields: [gameMatch.playerOagentId],
		references: [agentProfile.id],
		relationName: "gameMatch_playerOagentId_agentProfile_id",
	}),
}));

export const agentProfileRelations = relations(
	agentProfile,
	({ one, many }) => ({
		user: one(user, {
			fields: [agentProfile.userId],
			references: [user.id],
		}),
		gameMatches_playerXagentId: many(gameMatch, {
			relationName: "gameMatch_playerXagentId_agentProfile_id",
		}),
		gameMatches_playerOagentId: many(gameMatch, {
			relationName: "gameMatch_playerOagentId_agentProfile_id",
		}),
	}),
);
