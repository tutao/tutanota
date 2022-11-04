import type {MailboxProperties} from "../api/entities/tutanota/TypeRefs.js"
import {createMailboxProperties, MailboxGroupRootTypeRef, MailboxPropertiesTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {locator} from "../api/main/MainLocator"
import {ReportMovedMailsType} from "../api/common/TutanotaConstants"
import {logins} from "../api/main/LoginController"
import {downcast} from "@tutao/tutanota-utils"

/**
 * Loads the mailbox properties from the server.
 * Mailbox properties are created lazily by the client when we POST them.
 */
export function loadMailboxProperties(): Promise<MailboxProperties | null> {
	const mailMembership = logins.getUserController().getUserMailGroupMembership()
	return locator.entityClient.load(MailboxGroupRootTypeRef, mailMembership.group).then(grouproot => {
		if (grouproot.mailboxProperties) {
			return locator.entityClient.load<MailboxProperties>(MailboxPropertiesTypeRef, grouproot.mailboxProperties)
		} else {
			return null
		}
	})
}

export async function loadOrCreateMailboxProperties(): Promise<MailboxProperties> {
	const existing = await loadMailboxProperties()
	if (existing) {
		return existing
	}
	return  await saveReportMovedMails(null, ReportMovedMailsType.ALWAYS_ASK)
}

/**
 * Creates or updates mailboxProperties with the new reportMovedMails value.
 * @param props may be null if no MailboxProperties are set yet.
 * @param reportMovedMails new value.
 */
export async function saveReportMovedMails(props: MailboxProperties | null, reportMovedMails: ReportMovedMailsType): Promise<MailboxProperties> {
	if (!props) {
		props = createMailboxProperties({
			_ownerGroup: logins.getUserController().getUserMailGroupMembership().group,
		})
	}

	props.reportMovedMails = reportMovedMails
	await saveMailboxProperties(props)
	return props
}

/**
 * Creates or updates mailboxProperties.
 * The server takes care of creating the reference from MailboxGroupRoot.
 */
export async function saveMailboxProperties(props: MailboxProperties) {
	if (props._id) {
		await locator.entityClient.update(props)
	} else {
		props._id = await locator.entityClient.setup(null, props)
	}
}

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