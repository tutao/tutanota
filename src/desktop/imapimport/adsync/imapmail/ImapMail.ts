import { ImapMailRFC822Parser, MailParserAddressObject } from "./ImapMailRFC822Parser.js"
import { ImapMailbox } from "./ImapMailbox.js"
import { ProgrammingError } from "../../../../api/common/error/ProgrammingError.js"

export class ImapMailAddress {
	name?: string
	address?: string

	setName(name?: string): this {
		this.name = name
		return this
	}

	setAddress(address?: string): this {
		this.address = address
		return this
	}

	static fromMailParserAddressObject(mailParserAddressObject: any): ImapMailAddress {
		return new ImapMailAddress().setName(mailParserAddressObject.name as string).setAddress(mailParserAddressObject.address as string)
	}
}

export class ImapMailEnvelope {
	date?: Date
	subject?: string
	messageId?: string
	inReplyTo?: string
	references?: string[]
	from?: ImapMailAddress[]
	sender?: ImapMailAddress[]
	to?: ImapMailAddress[]
	cc?: ImapMailAddress[]
	bcc?: ImapMailAddress[]
	replyTo?: ImapMailAddress[]

	setDate(date: Date): this {
		this.date = date
		return this
	}

	setSubject(subject: string): this {
		this.subject = subject
		return this
	}

	setMessageId(messageId: string): this {
		this.messageId = messageId
		return this
	}

	setInReplyTo(inReplyTo: string): this {
		this.inReplyTo = inReplyTo
		return this
	}

	setReferences(references: string[]): this {
		this.references = references
		return this
	}

	setFrom(from: ImapMailAddress[]): this {
		this.from = from
		return this
	}

	setSender(sender: ImapMailAddress[]): this {
		this.sender = sender
		return this
	}

	setTo(to: ImapMailAddress[]): this {
		this.to = to
		return this
	}

	setCc(cc: ImapMailAddress[]): this {
		this.cc = cc
		return this
	}

	setBcc(bcc: ImapMailAddress[]): this {
		this.bcc = bcc
		return this
	}

	setReplyTo(replyTo: ImapMailAddress[]): this {
		this.replyTo = replyTo
		return this
	}

	static fromMailParserHeadersMap(mailParserHeadersMap: Map<string, string | string[] | MailParserAddressObject | Date | object>) {
		let imapMailEnvelope = new ImapMailEnvelope()

		if (mailParserHeadersMap.has("date")) {
			imapMailEnvelope.setDate(mailParserHeadersMap.get("date") as Date)
		}

		if (mailParserHeadersMap.has("subject")) {
			imapMailEnvelope.setSubject(mailParserHeadersMap.get("subject") as string)
		}

		if (mailParserHeadersMap.has("message-id")) {
			imapMailEnvelope.setMessageId(mailParserHeadersMap.get("message-id") as string)
		}

		if (mailParserHeadersMap.has("in-reply-to")) {
			imapMailEnvelope.setInReplyTo(mailParserHeadersMap.get("in-reply-to") as string)
		}

		if (mailParserHeadersMap.has("references")) {
			let headerReferences = mailParserHeadersMap.get("references")
			let references = typeof headerReferences === "string" ? [headerReferences] : (headerReferences as string[])
			imapMailEnvelope.setReferences(references)
		}

		if (mailParserHeadersMap.has("from")) {
			imapMailEnvelope.setFrom(
				(mailParserHeadersMap.get("from") as MailParserAddressObject).value.map((from) => ImapMailAddress.fromMailParserAddressObject(from)),
			)
		}

		if (mailParserHeadersMap.has("sender")) {
			imapMailEnvelope.setSender(
				(mailParserHeadersMap.get("sender") as MailParserAddressObject).value.map((sender) => ImapMailAddress.fromMailParserAddressObject(sender)),
			)
		}

		if (mailParserHeadersMap.has("to")) {
			imapMailEnvelope.setTo(
				(mailParserHeadersMap.get("to") as MailParserAddressObject).value.map((to) => ImapMailAddress.fromMailParserAddressObject(to)),
			)
		}

		if (mailParserHeadersMap.has("cc")) {
			imapMailEnvelope.setCc(
				(mailParserHeadersMap.get("cc") as MailParserAddressObject).value.map((cc) => ImapMailAddress.fromMailParserAddressObject(cc)),
			)
		}

		if (mailParserHeadersMap.has("bcc")) {
			imapMailEnvelope.setBcc(
				(mailParserHeadersMap.get("bcc") as MailParserAddressObject).value.map((bcc) => ImapMailAddress.fromMailParserAddressObject(bcc)),
			)
		}

		if (mailParserHeadersMap.has("reply-to")) {
			imapMailEnvelope.setReplyTo(
				(mailParserHeadersMap.get("reply-to") as MailParserAddressObject).value.map((replyTo) => ImapMailAddress.fromMailParserAddressObject(replyTo)),
			)
		}

		return imapMailEnvelope
	}
}

export class ImapMailAttachment {
	size: number
	headers: Map<string, string>
	contentType: string
	content: Buffer
	filename?: string
	cid?: string
	checksum: string
	related: boolean

	constructor(size: number, headers: Map<string, string>, contentType: string, content: Buffer, checksum: string, related: boolean) {
		this.size = size
		this.headers = headers
		this.contentType = contentType
		this.content = content
		this.checksum = checksum
		this.related = related
	}

	setFilename(filename?: string): this {
		this.filename = filename
		return this
	}

	setCid(cid?: string): this {
		this.cid = cid
		return this
	}
}

export class ImapMailBody {
	html: string
	plaintext: string
	plaintextAsHtml: string

	constructor(html: string, plaintext: string, plaintextAsHtml: string) {
		this.html = html
		this.plaintext = plaintext
		this.plaintextAsHtml = plaintextAsHtml
	}
}

export class ImapMail {
	uid: number
	modSeq?: BigInt
	size?: number
	internalDate?: Date
	flags?: Set<string>
	labels?: Set<string>
	envelope?: ImapMailEnvelope
	body?: ImapMailBody
	attachments?: ImapMailAttachment[]
	headers?: string
	belongsToMailbox: ImapMailbox
	externalMailId?: any
	rfc822Source?: Buffer

	constructor(uid: number, belongsToMailbox: ImapMailbox) {
		this.uid = uid
		this.belongsToMailbox = belongsToMailbox
	}

	setModSeq(modSeq?: BigInt): this {
		this.modSeq = modSeq
		return this
	}

	setSize(size?: number): this {
		this.size = size
		return this
	}

	setFlags(flags?: Set<string>): this {
		this.flags = flags
		return this
	}

	setInternalDate(internalDate?: Date): this {
		this.internalDate = internalDate
		return this
	}

	setLabels(labels?: Set<string>): this {
		this.labels = labels
		return this
	}

	setEnvelope(envelope?: ImapMailEnvelope): this {
		this.envelope = envelope
		return this
	}

	setBody(body?: ImapMailBody): this {
		this.body = body
		return this
	}

	setAttachments(attachments?: ImapMailAttachment[]): this {
		this.attachments = attachments
		return this
	}

	setHeaders(headers?: string): this {
		this.headers = headers
		return this
	}

	setExternalMailId(externalMailId?: any): this {
		this.externalMailId = externalMailId
		return this
	}

	setRfc822Source(rfc822Source?: Buffer): this {
		this.rfc822Source = rfc822Source
		return this
	}

	static async fromImapFlowFetchMessageObject(mail: FetchMessageObject, belongsToMailbox: ImapMailbox, externalMailId: any): Promise<ImapMail> {
		if (mail.source === undefined) {
			throw new ProgrammingError(`IMAP mail source not available.`)
		}

		let imapMailRFC822Parser = new ImapMailRFC822Parser()
		let parsedMailRFC822 = await imapMailRFC822Parser.parseSource(mail.source)

		let headersString = new TextDecoder().decode(mail.headers)

		// TODO use emailId when uid is not reliable
		let imapMail = new ImapMail(mail.uid, belongsToMailbox)
			.setModSeq(mail.modseq)
			.setSize(mail.size)
			.setInternalDate(mail.internalDate)
			.setFlags(mail.flags)
			.setLabels(mail.labels)
			.setHeaders(headersString)
			.setExternalMailId(externalMailId)
			.setRfc822Source(mail.source)

		if (parsedMailRFC822.parsedEnvelope) {
			imapMail.setEnvelope(parsedMailRFC822.parsedEnvelope)
		}

		if (parsedMailRFC822.parsedBody) {
			imapMail.setBody(parsedMailRFC822.parsedBody)
		}

		if (parsedMailRFC822.parsedAttachments) {
			imapMail.setAttachments(parsedMailRFC822.parsedAttachments)
		}

		return imapMail
	}
}
