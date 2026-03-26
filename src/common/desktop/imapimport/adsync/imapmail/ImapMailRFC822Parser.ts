import { ImapMailAttachment, ImapMailBody, ImapMailEnvelope } from "./ImapMail.js"
import * as Stream from "node:stream"

// @ts-ignore
import MailParser from "mailparser"

export type MailParserAddress = {
	name: string
	address: string
	group: MailParserAddress[]
}

export type MailParserAddressObject = {
	value: MailParserAddress[]
	text: string
	html: string
}

export interface ParsedImapRFC822 {
	parsedEnvelope?: ImapMailEnvelope
	parsedBody?: ImapMailBody
	parsedAttachments?: ImapMailAttachment[]
}

// TODO perform security HTML, etc. cleansing / sanitization
export class ImapMailRFC822Parser {
	private parser: typeof MailParser

	constructor() {
		this.parser = new MailParser()
	}

	async parseSource(source: Buffer): Promise<ParsedImapRFC822> {
		return new Promise<ParsedImapRFC822>((resolve, reject) => {
			let parsedImapRFC822: ParsedImapRFC822 = {}

			this.parser.on("headers", (headersMap: Map<string, string | string[] | MailParserAddressObject | Date | object>) => {
				parsedImapRFC822.parsedEnvelope = ImapMailEnvelope.fromMailParserHeadersMap(headersMap)
			})

			this.parser.on("data", async (data: any) => {
				if (data.type === "text") {
					parsedImapRFC822.parsedBody = new ImapMailBody(data.html, data.text, data.textAsHtml)
				}

				if (data.type === "attachment") {
					let content = await this.bufferFromStream(data.content)

					if (content.length > 0) {
						if (parsedImapRFC822.parsedAttachments === undefined) {
							parsedImapRFC822.parsedAttachments = []
						}

						let imapMailAttachment = new ImapMailAttachment(data.size, data.headers, data.contentType, content, data.checksum, data.related)
							.setFilename(data.filename)
							.setCid(data.cid)

						parsedImapRFC822.parsedAttachments?.push(imapMailAttachment)
					}
					data.release()
				}
			})

			this.parser.on("error", (err: Error) => reject(err))

			this.parser.on("end", () => {
				resolve(parsedImapRFC822)
			})

			this.parser.end(source)
		})
	}

	private bufferFromStream(stream: Stream): Promise<Buffer> {
		const chunks: Buffer[] = []
		return new Promise((resolve, reject) => {
			stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
			stream.on("error", (err) => reject(err))
			stream.on("end", () => resolve(Buffer.concat(chunks)))
		})
	}
}
