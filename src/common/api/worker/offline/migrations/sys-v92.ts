import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllListElements } from "../StandardMigrations.js"
import { BucketKey, BucketPermission, BucketPermissionTypeRef, GroupTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { CryptoProtocolVersion } from "../../../common/TutanotaConstants.js"
import { Mail, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const sys92: OfflineMigration = {
	app: "sys",
	version: 92,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(BucketPermissionTypeRef, storage, [addProtocolVersion])
		await migrateAllListElements(MailTypeRef, storage, [
			(e: Mail) => {
				if (e.bucketKey) {
					addProtocolVersion(e.bucketKey)
				}
				return e
			},
		])
		// KeyPair was changed
		await deleteInstancesOfType(storage, GroupTypeRef)
		// We also delete UserType ref to disable offline login. Otherwise, clients will see an unexpected error message with pure offline login.
		await deleteInstancesOfType(storage, UserTypeRef)
	},
}

function addProtocolVersion<T extends BucketKey | BucketPermission>(entity: T): T {
	if (entity.pubEncBucketKey) {
		entity.protocolVersion = CryptoProtocolVersion.RSA
	} else {
		entity.protocolVersion = CryptoProtocolVersion.SYMMETRIC_ENCRYPTION
	}
	return entity
}
