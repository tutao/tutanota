import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { addValue, deleteInstancesOfType, migrateAllElements } from "../StandardMigrations.js"
import { TutanotaPropertiesTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"

/**
 * Migration to patch up the broken tutanota-v77 migration.
 *
 * We write default value which might be out of sync with the server but we have an extra check for that where
 * we use this property.
 */
export const offline2: OfflineMigration = {
	app: "offline",
	version: 2,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		await migrateAllElements(TutanotaPropertiesTypeRef, storage, [addValue("defaultLabelCreated", false)])
	},
}
