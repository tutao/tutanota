import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements } from "../StandardMigrations"
import { User, UserTypeRef } from "../../../entities/sys/TypeRefs"
import { isOfflineStorageAvailable } from "../../../common/Env"
import { b64UserIdHash } from "../../search/DbFacade"

export const tutanota85: OfflineMigration = {
	app: "tutanota",
	version: 85,
	async migrate(storage: OfflineStorage) {
		if (isOfflineStorageAvailable()) {
			await migrateAllElements(UserTypeRef, storage, [
				(user: User) => {
					indexedDB.deleteDatabase(b64UserIdHash(user._id))
					return user
				},
			])
		}
	},
}
