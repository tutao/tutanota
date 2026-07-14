import o from "@tutao/otest"
import { offline15 } from "../../../../../src/app-kit/local-store/migrations/offline-v15"
import { OfflineStorage } from "../../../../../src/app-kit/local-store/OfflineStorage"
import { object, verify } from "testdouble"
import { MailSetEntryTypeRef } from "@tutao/entities/tutanota"

o.spec("offline-v15", () => {
	let migration: offline15
	let storage: OfflineStorage

	o.beforeEach(async () => {
		migration = new offline15()
		storage = object<OfflineStorage>()
	})

	o.test("migrate drops all ranges for MailSetEntry type", async () => {
		await migration.migrate(storage)
		verify(storage.deleteAllRangesOfType(MailSetEntryTypeRef), { times: 1 })
	})
})
