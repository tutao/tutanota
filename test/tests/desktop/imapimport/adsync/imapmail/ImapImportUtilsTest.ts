import o from "@tutao/otest"
import fs from "node:fs"
import { imapMailFromImapFlowFetchMessageObject } from "../../../../../../src/common/desktop/imapimport/adsync/imapmail/ImapImportUtils"
import { ImapMailbox } from "../../../../../../src/common/api/common/utils/imapImportUtils/ImapMailbox"

// See ImapMailRFC822ParserTest for more info.
export const IMAP_TEST_DATA_EXAMPLE_ONE: string = "./tests/desktop/imapimport/adsync/imapmail/sample/imap-example-1.txt"
export const IMAP_TEST_HEADERS_EXAMPLE_ONE: string = "./tests/desktop/imapimport/adsync/imapmail/sample/imap-headers-example-1.txt"

o.spec("imapMailFromImapFlowFetchMessageObject", function () {
	o("correctly parses expected values", async function () {
		const file = await fs.promises.readFile(IMAP_TEST_DATA_EXAMPLE_ONE)
		const imapHeaders = await fs.promises.readFile(IMAP_TEST_HEADERS_EXAMPLE_ONE)
		const source = Buffer.from(file)
		const date = new Date(2015, 5, 30)
		const testMail = {
			source,
			headers: imapHeaders,
			modseq: BigInt(10),
			size: 12345,
			internalDate: date,
			flags: new Set<string>(),
		}
		const result = await imapMailFromImapFlowFetchMessageObject(testMail, new ImapMailbox("INBOX"), "external-id")

		o(result.modSeq).equals(BigInt(10))
		o(result.size).equals(12345)
		o(result.internalDate).equals(date)
		o(result.flags?.size).equals(0)
		o(result.labels).equals(undefined)
		o(result.rfc822Source).equals(source)
		o(result.headers).equals(imapHeaders.toString())
	})
})
