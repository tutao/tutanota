import { ImapMailbox } from "./ImapMailbox.js"

export type ImapMailAddress = {
	name?: string
	address?: string
}

export type ImapMailEnvelope = {
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
}

export enum ImapMailAttachmentDisposition {
	Attachment = "attachment",
	Inline = "inline",
}

export type ImapMailAttachment = {
	size: number
	mimeType: string
	content: Buffer
	disposition?: ImapMailAttachmentDisposition
	filename?: string
	cid?: string
	method?: string
	related?: boolean
}

export type ImapMailBody = {
	html: string
	plaintext: string
}

export type ImapMail = {
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
}
