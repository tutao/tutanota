import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../offline/Sql"
import { untagSqlObject } from "../../offline/SqlValue"
import type { OfflineStorageTable } from "../../offline/OfflineStorage"
import type { SpamClassificationModel } from "../../../../../mail-app/workerUtils/spamClassification/SpamClassifier"
import { Nullable } from "@tutao/tutanota-utils"
import { decodeSpamClassificationModel, encodeSpamClassificationModel, SpamClassifierStorageFacade } from "./SpamClassifierStorageFacade"

export const SpamClassificationTableDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	spam_classification_model: {
		definition: "CREATE TABLE IF NOT EXISTS spam_classification_model (ownerGroup TEXT NOT NULL PRIMARY KEY, model BLOB NOT NULL)",
		purgedWithCache: true,
	},
})

/**
 * SpamClassifierStorageFacade for native SQLite (OfflineStorage)
 */
export class OfflineStorageSpamClassifierStorageFacade implements SpamClassifierStorageFacade {
	constructor(private readonly sql: SqlCipherFacade) {}

	async setSpamClassificationModel(model: SpamClassificationModel) {
		const { query, params } = sql`INSERT
		OR REPLACE INTO spam_classification_model VALUES (
		${model.ownerGroup},
		${encodeSpamClassificationModel(model)}
		)`
		await this.sql.run(query, params)
	}

	async getSpamClassificationModel(ownerGroup: Id): Promise<Nullable<SpamClassificationModel>> {
		const { query, params } = sql`SELECT model FROM spam_classification_model WHERE ownerGroup = ${ownerGroup}`
		const result = await this.sql.get(query, params)
		if (result == null) {
			return null
		} else {
			const model = untagSqlObject(result)["model"] as Uint8Array
			return decodeSpamClassificationModel(model)
		}
	}

	async deleteSpamClassificationModel(ownerGroup: Id) {
		const { query, params } = sql`DELETE FROM spam_classification_model WHERE ownerGroup = ${ownerGroup}`
		await this.sql.run(query, params)
	}
}
