import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements, Migration } from "../StandardMigrations.js"
import { Mail, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const sys83: OfflineMigration = {
	app: "sys",
	version: 83,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(MailTypeRef, storage, [migrateBucketKey()])
	},
}

function migrateBucketKey(): Migration<Mail> {
	return function (mail) {
		const bucketKey = mail.bucketKey
		if (bucketKey != null) {
			bucketKey["keyGroup"] = bucketKey["pubKeyGroup"]
			delete bucketKey["pubKeyGroup"]
			bucketKey["groupEncBucketKey"] = bucketKey["ownerEncBucketKey"]
			delete bucketKey["ownerEncBucketKey"]
		}
		return mail
	}
}
