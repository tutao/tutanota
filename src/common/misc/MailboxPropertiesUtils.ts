import type { MailboxProperties } from "../api/entities/tutanota/TypeRefs.js"
import { ReportMovedMailsType } from "../api/common/TutanotaConstants"
import { downcast } from "@tutao/tutanota-utils"

/**
 * @returns ALWAYS_ASK if not set yet.
 */
export function getReportMovedMailsType(props: MailboxProperties | null): ReportMovedMailsType {
	if (!props) {
		return ReportMovedMailsType.ALWAYS_ASK
	}

	return downcast(props.reportMovedMails)
}

export function getSenderName(mailboxProperties: MailboxProperties, senderAddress: string): string | null {
	return mailboxProperties.mailAddressProperties.find((a) => a.mailAddress === senderAddress)?.senderName ?? null
}
