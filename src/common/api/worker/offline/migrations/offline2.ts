import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { TutanotaPropertiesTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"

/**
 * Migration to patch up the broken tutanota-v77 migration which didn't delete TutanotaProperties initially.
 */
export const offline2: OfflineMigration = {
	app: "offline",
	version: 2,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		await deleteInstancesOfType(storage, TutanotaPropertiesTypeRef)
	},
}
