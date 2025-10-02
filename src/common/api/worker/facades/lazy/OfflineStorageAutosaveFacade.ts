import { AutosaveFacade, decodeLocalAutosavedDraftData, encodeLocalAutosavedDraftData, LOCAL_DRAFT_KEY, LocalAutosavedDraftData } from "./AutosaveFacade"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../offline/Sql"
import { untagSqlObject } from "../../offline/SqlValue"
import type { OfflineStorageTable } from "../../offline/OfflineStorage"

export const AutosaveDraftsTableDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	autosave_drafts: {
		definition: "CREATE TABLE IF NOT EXISTS autosave_drafts (id TEXT NOT NULL PRIMARY KEY, data BLOB NOT NULL)",
		purgedWithCache: false,
	},
})

/**
 * Autosave facade for native SQLite
 *
 * Can function with just a partial login unlike ConfigurationDatabase which makes it useful for native clients as you
 * can view and edit drafts while being offline.
 */
export class OfflineStorageAutosaveFacade implements AutosaveFacade {
	constructor(private readonly sql: SqlCipherFacade) {}

	async clearAutosavedDraftData(): Promise<void> {
		const { query, params } = sql`DELETE
                                    FROM autosave_drafts
                                    WHERE id = ${LOCAL_DRAFT_KEY}`
		await this.sql.run(query, params)
	}

	async getAutosavedDraftData(): Promise<LocalAutosavedDraftData | null> {
		const { query, params } = sql`SELECT data
                                    FROM autosave_drafts
                                    WHERE id = ${LOCAL_DRAFT_KEY}`
		const result = await this.sql.get(query, params)
		if (result == null) {
			return null
		}

		const data = untagSqlObject(result)["data"] as Uint8Array
		return decodeLocalAutosavedDraftData(data)
	}

	async setAutosavedDraftData(draftData: LocalAutosavedDraftData): Promise<void> {
		const { query, params } = sql`INSERT
        OR REPLACE INTO autosave_drafts (id, data) VALUES (
        ${LOCAL_DRAFT_KEY},
        ${encodeLocalAutosavedDraftData(draftData)}
        )`

		await this.sql.run(query, params)
	}
}
