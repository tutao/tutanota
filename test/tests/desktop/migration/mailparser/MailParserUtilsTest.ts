import o from "@tutao/otest"
import { migrationMailFromImapFlowFetchMessageObject } from "../../../../../src/applications/common/desktop/migration/mailparser/MailParserUtils"
import { FetchMessageObject } from "imapflow"

// See ImapMailRFC822ParserTest for more info.

o.spec("MailParserUtils", function () {
	o("migrationMailFromImapFlowFetchMessageObject correctly parses expected values", async function () {
		const source = Buffer.from(new Uint8Array())
		const date = new Date(2015, 5, 30)
		const testMail = {
			source,
			uid: 123,
			modseq: BigInt(10),
			size: 12345,
			internalDate: date,
			flags: new Set<string>(),
		} as FetchMessageObject
		const result = await migrationMailFromImapFlowFetchMessageObject(testMail, { path: "INBOX" })
		o(result.modSeq).equals(BigInt(10))
		o(result.size).equals(12345)
		o(result.internalDate).equals(date)
		o(result.flags?.size).equals(0)
		o(result.labels).equals(undefined)
		o(result.rfc822Source).equals(source)
	})
})
