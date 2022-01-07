import o from "ospec"
import {makeMailBundle} from "../../../../src/mail/export/Bundler"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {MailState} from "../../../../src/api/common/TutanotaConstants"
import {createMailAddress} from "../../../../src/api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../../../../src/api/entities/tutanota/EncryptedMailAddress"
import {downcast} from "@tutao/tutanota-utils"
import {MailBodyTypeRef} from "../../../../src/api/entities/tutanota/MailBody"
import {MailHeadersTypeRef} from "../../../../src/api/entities/tutanota/MailHeaders"
import {isSameTypeRef} from "@tutao/tutanota-utils"
import {isSameId} from "../../../../src/api/common/utils/EntityUtils"
import {FileTypeRef} from "../../../../src/api/entities/tutanota/File"
import {DataFile} from "../../../../src/api/common/DataFile";
import {HtmlSanitizer} from "../../../../src/misc/HtmlSanitizer"

o.spec("Bundler", function () {
	const anAttachmnet: DataFile = {
		_type: "DataFile",
		id: undefined,
		name: "attachment",
		cid: "cid",
		data: new Uint8Array(),
		size: 4,
		mimeType: "test"
	}
	o("make mail bundle non compressed headers", async function () {
		const mailId: IdTuple = ["maillistid", "maillid"]
		const subject = "hello"
		const mailBodyId = "mailbodyid"
		const body = "This is the body text of the body of the email"
		const sanitizedBodyText = "this is the sanitized body text of the email"
		const sender = {address: "sender@mycoolsite.co.uk", name: "the sender"}
		const to = [{address: "to@mycoolsite.co.uk", name: "the to"}]
		const cc = [{address: "cc@mycoolsite.co.uk", name: "the cc"}]
		const bcc = [{address: "bcc@mycoolsite.co.uk", name: "the bcc"}]
		const replyTo = [{address: "replyto@mycoolsite.co.uk", name: "the replyto"}]
		const sentOn = new Date()
		const receivedOn = new Date()
		const headers = "this is the headers"
		const entityClient = {
			load: o.spy(() => Promise.resolve({text: body, headers})),
		}

		const fileFacade = {
			downloadFileContent: o.spy(() => {
				return anAttachmnet
			})
		}

		const sanitizer = ({
				sanitizeHTML: o.spy(text => ({text: sanitizedBodyText})) as any
			} as Partial<HtmlSanitizer>) as HtmlSanitizer
		const mailHeadersId = "mailheadersid"
		const attachmentIds: IdTuple[] = [["listid", "attachid1"], ["listid", "attachid2"], ["listid", "attachid3"]]
		const mail = createMail({
			_id: mailId,
			body: mailBodyId,
			subject,
			sender: createMailAddress(sender),
			toRecipients: to.map(createMailAddress),
			ccRecipients: cc.map(createMailAddress),
			bccRecipients: bcc.map(createMailAddress),
			replyTos: replyTo.map(createEncryptedMailAddress),
			state: MailState.RECEIVED,
			unread: false,
			receivedDate: receivedOn,
			sentDate: sentOn,
			headers: mailHeadersId,
			attachments: attachmentIds,

		})

		const bundle = await makeMailBundle(mail, downcast(entityClient), downcast(fileFacade), downcast(sanitizer))

		o(bundle.mailId).deepEquals(mailId)
		o(bundle.subject).equals(subject)
		o(bundle.sender).deepEquals(sender)
		o(bundle.body).equals(sanitizedBodyText)
		o(bundle.to).deepEquals(to)
		o(bundle.cc).deepEquals(cc)
		o(bundle.bcc).deepEquals(bcc)
		o(bundle.replyTo).deepEquals(replyTo)
		o(bundle.isDraft).equals(false)("isDraft")
		o(bundle.isRead).equals(true)("isRead")
		o(bundle.headers).equals(headers)
		o(bundle.attachments).deepEquals([anAttachmnet, anAttachmnet, anAttachmnet])
		const compareCall = (typeRef, id) => call => isSameTypeRef(call.args[0], typeRef) && isSameId(call.args[1], id)
		const assertLoaded = (typeRef, id) => o(entityClient.load.calls.find(compareCall(typeRef, id))).notEquals(undefined)(`assertLoaded TypeRef(${typeRef.app}, ${typeRef.type}) ${id.toString()}`)
		assertLoaded(MailBodyTypeRef, mailBodyId)
		assertLoaded(MailHeadersTypeRef, mailHeadersId)
		attachmentIds.forEach(assertLoaded.bind(null, FileTypeRef))
		o(sanitizer.sanitizeHTML.calls[0].args).deepEquals([
			body, {blockExternalContent: false, allowRelativeLinks: false, usePlaceholderForInlineImages: false}
		])
	})
})