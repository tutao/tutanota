import o from "@tutao/otest"
import fs from "node:fs"
import { imapMailFromImapFlowFetchMessageObject } from "../../../../../../src/applications/common/desktop/imapimport/imapsync/imapmail/ImapParserUtils"
import { ImapMailbox } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { FetchMessageObject } from "imapflow"

// See ImapMailRFC822ParserTest for more info.

o.spec("ImapParserUtils", function () {
	o("imapMailFromImapFlowFetchMessageObject correctly parses expected values", async function () {
		const source = Buffer.from(new Uint8Array())
		const date = new Date(2015, 5, 30)
		const testMail = {
			source,
			modseq: BigInt(10),
			size: 12345,
			internalDate: date,
			flags: new Set<string>(),
		} as FetchMessageObject
		const result = await imapMailFromImapFlowFetchMessageObject(testMail, { path: "INBOX" })
		o(result.modSeq).equals(BigInt(10))
		o(result.size).equals(12345)
		o(result.internalDate).equals(date)
		o(result.flags?.size).equals(0)
		o(result.labels).equals(undefined)
		o(result.rfc822Source).equals(source)
	})
})
