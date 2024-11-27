import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements, Migration } from "../StandardMigrations"
import { CustomerInfoTypeRef } from "../../../entities/sys/TypeRefs.js"
import { SomeEntity } from "../../../common/EntityTypes.js"

export const sys114: OfflineMigration = {
	app: "sys",
	version: 114,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(CustomerInfoTypeRef, storage, [addUnlimitedLabelsToPlanConfiguration()])
	},
}

function addUnlimitedLabelsToPlanConfiguration(): Migration {
	return function addUnlimitedLabelsToPlanConfigurationMigration(entity: any): SomeEntity {
		if (entity.customPlan != null) {
			entity.customPlan.unlimitedLabels = false
		}
		return entity
	}
}
