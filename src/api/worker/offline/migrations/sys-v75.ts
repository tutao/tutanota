
import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"
import {createGiftCard, GiftCardTypeRef} from "../../../entities/sys/TypeRefs.js"
import {booleanToNumberValue, migrateAllListElements, renameAttribute} from "../StandardMigrations.js"
import {GiftCardStatus} from "../../../../subscription/giftcards/GiftCardUtils.js"

export const sys75: OfflineMigration = {
	app: "sys",
	version: 75,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(GiftCardTypeRef, storage, [
			booleanToNumberValue("usable"),
			renameAttribute("usable", "status"),
			// add value
			createGiftCard
		])
	}
}
