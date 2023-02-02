import { Address, Email } from "postal-mime"
import { MailParserAddressObject } from "../../../../desktop/imapimport/adsync/imapmail/ImapMailRFC822Parser.js"
import { ImapMailbox } from "./ImapMailbox.js"

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

	static fromPostalMimeAddress(postalMimeAddress: Address): ImapMailAddress {
		return new ImapMailAddress().setName(postalMimeAddress.name).setAddress(postalMimeAddress.address)
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

	static fromPostalMimeEmail(email: Email) {
		let imapMailEnvelope = new ImapMailEnvelope()

		if (email.date) {
			imapMailEnvelope.setDate(new Date(Date.parse(email.date)))
		}

		if (email.subject) {
			imapMailEnvelope.setSubject(email.subject)
		}

		if (email.messageId) {
			imapMailEnvelope.setMessageId(email.messageId)
		}

		if (email.inReplyTo) {
			imapMailEnvelope.setInReplyTo(email.inReplyTo)
		}

		if (email.references) {
			let references = email.references.split(",")
			imapMailEnvelope.setReferences(references)
		}

		if (email.from) {
			imapMailEnvelope.setFrom([ImapMailAddress.fromPostalMimeAddress(email.from)])
		}

		if (email.sender) {
			imapMailEnvelope.setSender([ImapMailAddress.fromPostalMimeAddress(email.sender)])
		}

		if (email.to) {
			imapMailEnvelope.setTo(email.to.map((to) => ImapMailAddress.fromPostalMimeAddress(to)))
		}

		if (email.cc) {
			imapMailEnvelope.setCc(email.cc.map((cc) => ImapMailAddress.fromPostalMimeAddress(cc)))
		}

		if (email.bcc) {
			imapMailEnvelope.setBcc(email.bcc.map((bcc) => ImapMailAddress.fromPostalMimeAddress(bcc)))
		}

		if (email.replyTo) {
			imapMailEnvelope.setReplyTo(email.replyTo.map((replyTo) => ImapMailAddress.fromPostalMimeAddress(replyTo)))
		}

		return imapMailEnvelope
	}
}

export class ImapMailAttachment {
	size: number
	contentType: string
	content: Buffer
	filename?: string
	cid?: string
	related: boolean

	constructor(size: number, contentType: string, content: Buffer, related: boolean) {
		this.size = size
		this.contentType = contentType
		this.content = content
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

	constructor(html: string, plaintext: string) {
		this.html = html
		this.plaintext = plaintext
	}
}

export class ImapMail {
	uid: number
	modSeq?: bigint
	size?: number
	internalDate?: Date
	flags?: Set<string>
	labels?: Set<string>
	envelope?: ImapMailEnvelope
	body?: ImapMailBody
	attachments?: ImapMailAttachment[]
	headers?: string
	belongsToMailbox: ImapMailbox
	rfc822Source?: Buffer

	constructor(uid: number, belongsToMailbox: ImapMailbox) {
		this.uid = uid
		this.belongsToMailbox = belongsToMailbox
	}

	setModSeq(modSeq?: bigint): this {
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

	setRfc822Source(rfc822Source?: Buffer): this {
		this.rfc822Source = rfc822Source
		return this
	}
}
