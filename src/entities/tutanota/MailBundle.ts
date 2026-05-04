
/**
 * Used to pass all downloaded mail stuff to the desktop side to be exported as a file
 * Ideally this would just be {Mail, Headers, Body, FileReference[]}
 * but we can't send Dates over to the native side, so we may as well just extract everything here
 */
export type MailBundleRecipient = {
	address: string
	name?: string
}
/**
 * a structure containing file content and metadata
 */
export interface DataFile {
	readonly _type: "DataFile"
	name: string
	mimeType: string
	data: Uint8Array
	size: number
	id?: IdTuple
	cid?: string
}



export type MailBundle = {
	mailId: IdTuple
	subject: string
	body: string
	sender: MailBundleRecipient
	to: MailBundleRecipient[]
	cc: MailBundleRecipient[]
	bcc: MailBundleRecipient[]
	replyTo: MailBundleRecipient[]
	isDraft: boolean
	isRead: boolean
	sentOn: number
	// UNIX timestamp
	receivedOn: number // UNIX timestamp,
	headers: string | null
	attachments: DataFile[]
}
