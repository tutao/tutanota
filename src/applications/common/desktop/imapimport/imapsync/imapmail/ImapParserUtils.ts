import { ImapMailbox } from "../../../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapMail } from "../../../../api/common/utils/imapImportUtils/ImapMail"
import { ImapMailRFC822Parser } from "./ImapMailRFC822Parser"
import { ProgrammingError } from "@tutao/app-env"

export async function imapMailFromImapFlowFetchMessageObject(mail: any, belongsToMailbox: ImapMailbox, externalMailId: any): Promise<ImapMail> {
	if (mail.source === undefined) {
		throw new ProgrammingError(`IMAP mail source not available.`)
	}

	const imapMailRFC822Parser = new ImapMailRFC822Parser()
	const parsedMailRFC822 = await imapMailRFC822Parser.parseSource(mail.source)

	const headersString = new TextDecoder().decode(mail.headers)

	const imapMail = new ImapMail(mail.uid, belongsToMailbox)
		.setModSeq(mail.modseq)
		.setSize(mail.size)
		.setInternalDate(mail.internalDate)
		.setFlags(mail.flags)
		.setLabels(mail.labels)
		.setHeaders(headersString)
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
