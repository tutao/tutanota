import o from "ospec"
import {
	create,
	GENERATED_MIN_ID,
	generatedIdToTimestamp,
	removeTechnicalFields,
	timestampToGeneratedId,
	timestampToHexGeneratedId,
} from "../../../../../src/api/common/utils/EntityUtils.js"
import { MailTypeRef } from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import { typeModels } from "../../../../../src/api/entities/tutanota/TypeModels.js"
import { hasError } from "../../../../../src/api/common/utils/ErrorCheckUtils.js"
import { ElementEntity } from "../../../../../src/api/common/EntityTypes.js"
import { clone, TypeRef } from "@tutao/tutanota-utils"

o.spec("EntityUtils", function () {
	o("TimestampToHexGeneratedId ", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp, 0)).equals("4fc6fbb10000000000")
	})
	o("TimestampToHexGeneratedId server id 1", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp, 1)).equals("4fc6fbb10000000001")
	})
	o("generatedIdToTimestamp ", function () {
		let maxTimestamp = Math.pow(2, 42) - 1
		o(generatedIdToTimestamp(GENERATED_MIN_ID)).equals(0)
		o(generatedIdToTimestamp(timestampToGeneratedId(0))).equals(0)
		o(generatedIdToTimestamp("zzzzzzzzzzzz")).equals(maxTimestamp)
		o(generatedIdToTimestamp("IwQvgF------")).equals(1370563200000)
	})

	o("create new entity without error object ", function () {
		const mailEntity = create(typeModels.Mail, MailTypeRef)
		o(mailEntity._errors).equals(undefined)
		o(hasError(mailEntity)).equals(false)

		o(mailEntity.subject).equals("") // value with default value
		o(mailEntity.attachments).deepEquals([]) // association with Any cardinality
		o(mailEntity.firstRecipient).equals(null) // association with ZeroOrOne cardinality
	})

	o.spec("removeTechnicalFields", function () {
		const typeRef = { app: "testapp", type: "testentity" } as TypeRef<unknown>

		function makeEntity() {
			return {
				_id: "test",
				// so that we can compare it
				_type: typeRef,
				_ownerGroup: null,
				_ownerEncSessionKey: null,
			}
		}

		o("it doesn't do anything when there's nothing to remove", function () {
			const originalEntity = makeEntity()
			const entityCopy = clone(originalEntity)
			removeTechnicalFields(entityCopy as ElementEntity)
			o(entityCopy as unknown).deepEquals(originalEntity)
		})

		o("it removes _finalEncrypted fields directly on the entity", function () {
			const originalEntity = { ...makeEntity(), _finalEncryptedThing: [1, 2, 3] }
			const entityCopy = clone(originalEntity)
			removeTechnicalFields(entityCopy as ElementEntity)
			o(entityCopy as unknown).deepEquals({
				_id: "test",
				_type: typeRef,
				_ownerGroup: null,
				_ownerEncSessionKey: null,
			})
		})

		o("it removes _finalEncrypted fields deeper in the entity", function () {
			const originalEntity = {
				...makeEntity(),
				nested: {
					test: "yes",
					_finalEncryptedThing: [1, 2, 3],
				},
			}
			const entityCopy = clone(originalEntity)
			removeTechnicalFields(entityCopy as ElementEntity)
			o(entityCopy as unknown).deepEquals({
				_id: "test",
				_type: typeRef,
				_ownerGroup: null,
				_ownerEncSessionKey: null,
				nested: {
					test: "yes",
				},
			})
		})
	})
})
