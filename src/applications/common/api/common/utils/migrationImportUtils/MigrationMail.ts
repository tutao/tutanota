import { MigrationMailbox } from "./MigrationMailbox.js"

export type MigrationMailAddress = {
	name?: string
	address?: string
}

export type MigrationMailEnvelope = {
	date?: Date
	subject?: string
	messageId?: string
	inReplyTo?: string
	references?: string[]
	from?: MigrationMailAddress[]
	sender?: MigrationMailAddress[]
	to?: MigrationMailAddress[]
	cc?: MigrationMailAddress[]
	bcc?: MigrationMailAddress[]
	replyTo?: MigrationMailAddress[]
}

export enum MigrationMailAttachmentDisposition {
	Attachment = "attachment",
	Inline = "inline",
}

export type MigrationMailAttachment = {
	size: number
	mimeType: string
	content: Buffer<ArrayBuffer>
	disposition?: MigrationMailAttachmentDisposition
	filename?: string
	cid?: string
	method?: string
	related?: boolean
}
export type MigrationMailBody = {
	html: string
	plaintext: string
}

export type MigrationMail = {
	uid: number
	modSeq?: bigint
	size?: number
	internalDate?: Date
	flags?: Set<string>
	labels?: Set<string>
	envelope?: MigrationMailEnvelope
	body?: MigrationMailBody
	attachments?: MigrationMailAttachment[]
	headers?: string
	belongsToMailbox: MigrationMailbox
	rfc822Source?: Buffer
}
