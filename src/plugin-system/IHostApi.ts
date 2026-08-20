export interface IHostApi {
	getMail(id: string): Promise<Mail>
}

export type Mail = {
	id: string
	from: string
	to: string[]
	cc: string[]
	bcc: string[]
	subject: string
	body: string
	attachments: string[]
	sentAt: Date
	isRead: boolean
}
