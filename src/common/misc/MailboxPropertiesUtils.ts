import { tutanotaTypeRefs } from "@tutao/typerefs"
import { ReportMovedMailsType } from "@tutao/app-env"
import { downcast } from "@tutao/utils"

/**
 * @returns ALWAYS_ASK if not set yet.
 */
export function getReportMovedMailsType(props: tutanotaTypeRefs.MailboxProperties | null): ReportMovedMailsType {
	if (!props) {
		return ReportMovedMailsType.ALWAYS_ASK
	}

	return downcast(props.reportMovedMails)
}

export function getSenderName(mailboxProperties: tutanotaTypeRefs.MailboxProperties, senderAddress: string): string | null {
	return mailboxProperties.mailAddressProperties.find((a) => a.mailAddress === senderAddress)?.senderName ?? null
}
