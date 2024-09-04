import o from "@tutao/otest"
import { OfflineStorage } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { object, when } from "testdouble"
import { GiftCard, GiftCardTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { booleanToNumberValue, migrateAllListElements, renameAttribute } from "../../../../../src/common/api/worker/offline/StandardMigrations.js"
import { verify } from "@tutao/tutanota-test-utils"
import { ListElementEntity } from "../../../../../src/common/api/common/EntityTypes.js"

o.spec("OfflineStorageMigrations", function () {
	o.spec("migrateAllListElements", function () {
		o("should run migrations in the correct order on all entities", async function () {
			const storageMock = object<OfflineStorage>()

			when(storageMock.getRawListElementsOfType(GiftCardTypeRef)).thenResolve([
				{ message: "A" },
				{ message: "B" },
				{ message: "C" },
			] as unknown as ListElementEntity[])

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

			verify(storageMock.put({ message: "A123", _type: GiftCardTypeRef } as GiftCard))
			verify(storageMock.put({ message: "B123", _type: GiftCardTypeRef } as GiftCard))
			verify(storageMock.put({ message: "C123", _type: GiftCardTypeRef } as GiftCard))
		})
	})
	o.spec("migrations", function () {
		o("should rename 'oldAttribute' to 'newAttribute' and ignore other attributes", function () {
			o(renameAttribute("oldAttribute", "newAttribute")({ oldAttribute: "value of attribute", ignoreMe: "doing nothing" }) as any).deepEquals({
				newAttribute: "value of attribute",
				ignoreMe: "doing nothing",
			})
		})

		o("should convert true to '1' and ignore other attributes", function () {
			o(booleanToNumberValue("attr")({ attr: true, ignoreMe: "doing nothing" }) as any).deepEquals({ attr: "1", ignoreMe: "doing nothing" })
		})

		o("should convert false to '0' and ignore other attributes", function () {
			o(booleanToNumberValue("attr")({ attr: false, ignoreMe: "doing nothing" }) as any).deepEquals({ attr: "0", ignoreMe: "doing nothing" })
		})
	})
})
