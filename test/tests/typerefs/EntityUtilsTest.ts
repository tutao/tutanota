import o from "@tutao/otest"
import { MailTypeRef, tutanotaTypeModels } from "@tutao/entities/tutanota"
import {
	constructMailSetEntryId,
	create,
	deconstructMailSetEntryId,
	GENERATED_MIN_ID,
	generatedIdToTimestamp,
	hasError,
	idToElementId,
	timestampToGeneratedId,
	timestampToHexGeneratedId,
} from "../../../src/platform-kit/meta"

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

	o.spec("MailSetEntry id", function () {
		o("constructMailSetEntryId", function () {
			const mailId: Id = "-----------0"

			const expected = "V7ifKQAAAAAAAAAAAQ"
			const receiveDate = new Date("2017-10-03T13:46:13Z")

			const calculatedId = constructMailSetEntryId(receiveDate, mailId)
			o(expected).equals(calculatedId)
		})

		o("deconstructMailSetEntryId", function () {
			const setEntryId = "V7ifKQAAAAAAAAAAAQ"
			const { receiveDate, mailId } = deconstructMailSetEntryId(setEntryId)
			const diff = Math.abs(receiveDate.getTime() - new Date("2017-10-03T13:46:12.864Z").getTime())
			o(diff < 10).equals(true)(`Expected a date near ${new Date("2017-10-03T13:46:12.864Z")}, got: ${receiveDate} with diff ${diff}`)
			o(mailId).equals("-----------0")
		})
	})

	o("create new entity without error object ", function () {
		const mailEntity = create(tutanotaTypeModels[MailTypeRef.typeId], MailTypeRef)
		o(mailEntity._errors).equals(undefined)
		o(hasError(mailEntity)).equals(false)

		o(mailEntity.subject).equals("") // value with default value
		o(mailEntity.attachments).deepEquals([]) // association with Any cardinality
		o(mailEntity.firstRecipient).equals(null) // association with ZeroOrOne cardinality
	})
})
