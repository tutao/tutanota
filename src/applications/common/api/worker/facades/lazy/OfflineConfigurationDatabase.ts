import { ConfigurationDatabase } from "./ConfigurationDatabase"
import { EntityUpdateData } from "../../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ExternalImageRule, NewsletterBannerRule } from "../../../../../../entities/tutanota/Utils"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import type { OfflineStorageTable } from "../../../../../../app-kit/local-store/OfflineStorage"
import { sql } from "../../../../../../app-kit/local-store/Sql"
import { untagSqlValue } from "../../../../../../app-kit/local-store/SqlValue"
import { IndexedDbConfigurationDatabase } from "./IndexedDbConfigurationDatabase"
import { defer, DeferredObject, lazyAsync, lazy } from "@tutao/utils"

export const OfflineConfigurationDatabaseDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	offline_configuration_db_metadata: {
		definition: "CREATE TABLE IF NOT EXISTS offline_configuration_db_metadata (key TEXT NOT NULL PRIMARY KEY, value TEXT NOT NULL)",
		purgedWithCache: false,
	},
	external_image_rules: {
		definition: "CREATE TABLE IF NOT EXISTS external_image_rules (address TEXT NOT NULL PRIMARY KEY, rule TEXT NOT NULL)",
		purgedWithCache: false,
	},
	newsletter_banner_rules: {
		definition: "CREATE TABLE IF NOT EXISTS newsletter_banner_rules (address TEXT NOT NULL PRIMARY KEY, rule TEXT NOT NULL)",
		purgedWithCache: false,
	},
})

const TAG = "[OfflineConfigurationDatabase]"
const MIGRATED_FROM_INDEXED_DB_FLAG = "migratedFromIndexedDb"

/**
 * Provides access to external image rules and newsletter banner rules when partially logged in.
 */
export class OfflineConfigurationDatabase implements ConfigurationDatabase {
	private readonly migrateTrigger: DeferredObject<void> = defer()

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

	async needsMigratedFromIndexedDbConfigurationDatabase(): Promise<boolean> {
		const result = await this.sql.get(`SELECT value FROM offline_configuration_db_metadata WHERE key = '${MIGRATED_FROM_INDEXED_DB_FLAG}'`, [])

		// the mere non-existence of this says it all
		return result == null
	}

	async migrateFromIndexedDbConfigurationDatabase(oldDatabaseProvider: lazyAsync<IndexedDbConfigurationDatabase>, userIdProvider: lazy<Id>) {
		await this.migrateTrigger.promise

		const db = await oldDatabaseProvider()
		const rules = await db.dumpRules()
		if (rules == null) {
			console.warn(TAG, "Can't migrate IndexedDbConfigurationDatabase to OfflineConfigurationDatabase!")
			return
		}

		const { imageRules, newsletterBannerRules } = rules
		for (const [address, rule] of Object.entries(imageRules)) {
			await this.addExternalImageRule(address, rule)
		}
		for (const [address, rule] of Object.entries(newsletterBannerRules)) {
			await this.addNewsletterBannerRule(address, rule)
		}

		console.log(
			TAG,
			`Imported ${Object.keys(imageRules).length} image rule(s) and ${Object.keys(newsletterBannerRules).length} newsletter banner rule(s) from IndexedDbConfigurationDatabase.`,
		)

		await db.delete(userIdProvider())
		await this.sql.run(`INSERT OR REPLACE INTO offline_configuration_db_metadata (key, value) VALUES ('${MIGRATED_FROM_INDEXED_DB_FLAG}', '1')`, [])
	}

	async onEntityUpdatesReceived(_events: readonly EntityUpdateData[], _batchId: Id, _groupId: Id): Promise<void> {
		// no-op
	}

	async delete(_userId: Id): Promise<void> {
		// no-op - deleted with the offline database
	}

	triggerMigrationIfNeeded() {
		this.migrateTrigger.resolve()
	}
}
