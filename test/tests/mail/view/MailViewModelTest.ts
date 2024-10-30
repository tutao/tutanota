import o from "@tutao/otest"
import { createTestEntity } from "../../TestUtils"
import { MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { sortCompareMailSetMailsReversed } from "../../../../src/mail-app/mail/view/MailViewModel"
import { arrayEquals } from "@tutao/tutanota-utils"

o.spec("MailViewModel", function () {
	o.spec("sortCompareMailSetMailsReversed sorts mails first by receivedDate and than mailId", function () {
		o("when mailId of mail1 is newer (i.e. larger) than mailId of mail2, still sort by receivedDate", async function () {
			let mail1 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "b"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})
			let mail2 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "a"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 1, 0),
			})

			let result = [mail2, mail1].sort(sortCompareMailSetMailsReversed)
			o(arrayEquals(result, [mail2, mail1])).equals(true)(`Wrong sort order! Mails should sort by receivedDate.`)
			o(sortCompareMailSetMailsReversed(mail1, mail2)).equals(1)
			o(sortCompareMailSetMailsReversed(mail2, mail1)).equals(-1)
		})

		o("when mailIds are same, still sort by receivedDate", async function () {
			let mail1 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})
			let mail2 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 1, 0),
			})

			let result = [mail1, mail2].sort(sortCompareMailSetMailsReversed)
			o(arrayEquals(result, [mail2, mail1])).equals(true)(`Wrong sort order! Mails should sort by receivedDate.`)
			o(sortCompareMailSetMailsReversed(mail1, mail2)).equals(1)
			o(sortCompareMailSetMailsReversed(mail2, mail1)).equals(-1)
		})

		o("still sort by receivedDate, even though mailIds would sort differently with three mails", async function () {
			let mail1 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "b"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})
			let mail2 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "a"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 2, 0),
			})
			let mail3 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "c"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 1, 0),
			})

			let result = [mail2, mail1, mail3].sort(sortCompareMailSetMailsReversed)
			o(arrayEquals(result, [mail2, mail3, mail1])).equals(true)(`Wrong sort order! Mails should sort by receivedDate.`)
		})

		o("when receivedDate same, then sort by mailId", async function () {
			let mail1 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "b"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})
			let mail2 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "a"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})

			o("a" > "b").equals(false)
			o("a" < "b").equals(true)
			let result = [mail2, mail1].sort(sortCompareMailSetMailsReversed)
			o(arrayEquals(result, [mail1, mail2])).equals(true)(`Wrong sort order! Mails should sort by mailId in this case.`)
			o(sortCompareMailSetMailsReversed(mail1, mail2)).equals(-1)
			o(sortCompareMailSetMailsReversed(mail2, mail1)).equals(1)
		})

		o("when both receivedDates and mailIds are the same, then return 0", async function () {
			let mail1 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})
			let mail2 = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				receivedDate: new Date(2024, 10, 1, 0, 0, 0, 0),
			})

			o(sortCompareMailSetMailsReversed(mail2, mail1)).equals(0)
			o(sortCompareMailSetMailsReversed(mail1, mail2)).equals(0)(`Wrong return value! Should return 0.`)
		})
	})
})
