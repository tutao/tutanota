import o from "@tutao/otest"
import { AttachmentType, getAttachmentType } from "../../../src/ui/AttachmentBubble"

o.spec("AttachmentBubble", function () {
	o.spec("getAttachmentType", function () {
		o.test("returns calendar type if MIME type is text/calendar", function () {
			o.check(getAttachmentType("text/calendar", "foo")).equals(AttachmentType.CALENDAR)
		})
		o.test("returns calendar type if MIME type is incorrect but extension is .ics", function () {
			o.check(getAttachmentType("invalid/mime", "foo.ics")).equals(AttachmentType.CALENDAR)
		})
		o.test("returns contact type if MIME type is text/vcard", function () {
			o.check(getAttachmentType("text/vcard", "foo")).equals(AttachmentType.CONTACT)
		})
		o.test("returns mail type if MIME type is message/rfc822", function () {
			o.check(getAttachmentType("message/rfc822", "foo")).equals(AttachmentType.MAIL)
		})
	})
})
