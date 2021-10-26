//@flow
import type {MailboxProperties} from "../api/entities/tutanota/MailboxProperties"
import {createMailboxProperties, MailboxPropertiesTypeRef} from "../api/entities/tutanota/MailboxProperties"
import {locator} from "../api/main/MainLocator"
import type {ReportMovedMailsTypeEnum} from "../api/common/TutanotaConstants"
import {ReportMovedMailsType} from "../api/common/TutanotaConstants"
import {logins} from "../api/main/LoginController"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {downcast} from "@tutao/tutanota-utils"

/**
 * Loads the mailbox properties from the server.
 */
export function loadMailboxProperties(): Promise<?MailboxProperties> {
	const mailMembership = logins.getUserController().getUserMailGroupMembership()
	return locator.entityClient.load(MailboxGroupRootTypeRef, mailMembership.group).then((grouproot) => {
		if (grouproot.mailboxProperties) {
			return locator.entityClient.load(MailboxPropertiesTypeRef, grouproot.mailboxProperties)
		}
	})
}

/**
 * Creates or updates mailboxProperties with the new reportMovedMails value.
 * @param props may be null if no MailboxProperties are set yet.
 * @param reportMovedMails new value.
 */
export function saveReportMovedMails(props: ?MailboxProperties, reportMovedMails: ReportMovedMailsTypeEnum) {
	if (!props) {
		props = createMailboxProperties({_ownerGroup: logins.getUserController().getUserMailGroupMembership().group})
	}
	props.reportMovedMails = reportMovedMails
	saveMailboxProperties(props)
}

/**
 * Creates or updates mailboxProperties.
 * The server takes care of creating the reference from MailboxGroupRoot.
 */
export function saveMailboxProperties(props: MailboxProperties) {
	props._id
		? locator.entityClient.update(props)
		: locator.entityClient.setup(null, props)
}

/**
 * @returns ALWAYS_ASK if not set yet.
 */
export function getReportMovedMailsType(props: ?MailboxProperties): ReportMovedMailsTypeEnum {
	if (!props) {
		return ReportMovedMailsType.ALWAYS_ASK
	}
	return downcast(props.reportMovedMails)
}