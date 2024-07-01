import o from "@tutao/otest"
import { OfflineStorage } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { matchers, object, when } from "testdouble"
import { GiftCard, GiftCardTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { booleanToNumberValue, migrateAllListElements, renameAttribute } from "../../../../../src/common/api/worker/offline/StandardMigrations.js"
import { verify } from "@tutao/tutanota-test-utils"

const { anything } = matchers

o.spec("OfflineStorageMigrations", function () {
	o.spec("migrateAllListElements", function () {
		o("should run migrations in the correct order on all entities", async function () {
			const storageMock = object<OfflineStorage>()

			when(storageMock.getListElementsOfType(GiftCardTypeRef)).thenResolve([{ message: "A" }, { message: "B" }, { message: "C" }] as GiftCard[])

			await migrateAllListElements(GiftCardTypeRef, storageMock, [
				(card) => {
					card.message = card.message + "1"
					return card
				},
				(card) => {
					card.message = card.message + "2"
					return card
				},
				(card) => {
					card.message = card.message + "3"
					return card
				},
			])

			verify(storageMock.put({ message: "A123" } as GiftCard))
			verify(storageMock.put({ message: "B123" } as GiftCard))
			verify(storageMock.put({ message: "C123" } as GiftCard))
		})
	})
	o.spec("migrations", function () {
		o("should rename 'oldAttribute' to 'newAttribute' and ignore other attributes", function () {
			o(renameAttribute<any>("oldAttribute", "newAttribute")({ oldAttribute: "value of attribute", ignoreMe: "doing nothing" })).deepEquals({
				newAttribute: "value of attribute",
				ignoreMe: "doing nothing",
			})
		})

		o("should convert true to '1' and ignore other attributes", function () {
			o(booleanToNumberValue<any>("attr")({ attr: true, ignoreMe: "doing nothing" })).deepEquals({ attr: "1", ignoreMe: "doing nothing" })
		})

		o("should convert false to '0' and ignore other attributes", function () {
			o(booleanToNumberValue<any>("attr")({ attr: false, ignoreMe: "doing nothing" })).deepEquals({ attr: "0", ignoreMe: "doing nothing" })
		})
	})
})
