import type {MailboxProperties} from "../api/entities/tutanota/TypeRefs.js"
import {createMailboxProperties, MailboxPropertiesTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {locator} from "../api/main/MainLocator"
import {ReportMovedMailsType} from "../api/common/TutanotaConstants"
import {logins} from "../api/main/LoginController"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {downcast} from "@tutao/tutanota-utils"

/**
 * Loads the mailbox properties from the server.
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

/**
 * Creates or updates mailboxProperties with the new reportMovedMails value.
 * @param props may be null if no MailboxProperties are set yet.
 * @param reportMovedMails new value.
 */
export function saveReportMovedMails(props: MailboxProperties | null, reportMovedMails: ReportMovedMailsType) {
	if (!props) {
		props = createMailboxProperties({
			_ownerGroup: logins.getUserController().getUserMailGroupMembership().group,
		})
	}

	props.reportMovedMails = reportMovedMails
	saveMailboxProperties(props)
}

/**
 * Creates or updates mailboxProperties.
 * The server takes care of creating the reference from MailboxGroupRoot.
 */
export function saveMailboxProperties(props: MailboxProperties) {
	props._id ? locator.entityClient.update(props) : locator.entityClient.setup(null, props)
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