import { ConfigurationDatabase } from "./ConfigurationDatabase"
import { EntityUpdateData } from "../../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ExternalImageRule, NewsletterBannerRule } from "../../../../../../entities/tutanota/Utils"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import type { OfflineStorageTable } from "../../../../../../app-kit/local-store/OfflineStorage"
import { sql } from "../../../../../../app-kit/local-store/Sql"
import { untagSqlValue } from "../../../../../../app-kit/local-store/SqlValue"

export const OfflineConfigurationDatabaseDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	external_image_rules: {
		definition: "CREATE TABLE IF NOT EXISTS external_image_rules (address TEXT NOT NULL PRIMARY KEY, rule TEXT NOT NULL)",
		purgedWithCache: false,
	},
	newsletter_banner_rules: {
		definition: "CREATE TABLE IF NOT EXISTS newsletter_banner_rules (address TEXT NOT NULL PRIMARY KEY, rule TEXT NOT NULL)",
		purgedWithCache: false,
	},
})

/**
 * Provides access to external image rules and newsletter banner rules when partially logged in.
 */
export class OfflineConfigurationDatabase implements ConfigurationDatabase {
	constructor(private readonly sql: SqlCipherFacade) {}

	async addExternalImageRule(address: string, rule: ExternalImageRule): Promise<void> {
		const { query, params } = sql`INSERT
		OR REPLACE INTO external_image_rules (address, rule) VALUES (
		${address},
		${rule}
		)`

		await this.sql.run(query, params)
	}

	async addNewsletterBannerRule(address: string, rule: NewsletterBannerRule): Promise<void> {
		const { query, params } = sql`INSERT
		OR REPLACE INTO newsletter_banner_rules (address, rule) VALUES (
		${address},
		${rule}
		)`

		await this.sql.run(query, params)
	}

	async getExternalImageRule(address: string): Promise<ExternalImageRule> {
		const { query, params } = sql`SELECT rule
									  FROM external_image_rules
									  WHERE address = ${address} LIMIT 1`

		const result = await this.sql.get(query, params)
		if (result == null) {
			return ExternalImageRule.None
		}

		return untagSqlValue(result.rule) as ExternalImageRule
	}

	async getNewsletterBannerRule(address: string): Promise<NewsletterBannerRule> {
		const { query, params } = sql`SELECT rule
									  FROM newsletter_banner_rules
									  WHERE address = ${address} LIMIT 1`

		const result = await this.sql.get(query, params)
		if (result == null) {
			return NewsletterBannerRule.Allow
		}

		return untagSqlValue(result.rule) as NewsletterBannerRule
	}

	async onEntityUpdatesReceived(_events: readonly EntityUpdateData[], _batchId: Id, _groupId: Id): Promise<void> {
		// no-op
	}

	async delete(_userId: Id): Promise<void> {
		// no-op - deleted with the offline database
	}
}
