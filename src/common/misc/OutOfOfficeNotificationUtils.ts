import type { OutOfOfficeNotification } from "../api/entities/tutanota/TypeRefs.js"
import { OutOfOfficeNotificationTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { formatDate } from "./Formatter"
import { lang } from "./LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { MailboxGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { getDayShifted } from "@tutao/tutanota-utils"

/**
 * Returns true if notifications are currently sent.
 */
export function isNotificationCurrentlyActive(notification: OutOfOfficeNotification, currentDate: Date): boolean {
	if (notification.enabled) {
		if (notification.startDate && !notification.endDate) {
			return currentDate >= notification.startDate
		} else if (notification.startDate && notification.endDate) {
			return currentDate >= notification.startDate && currentDate < notification.endDate
		} else {
			// no dates specified but enabled
			return true
		}
	} else {
		return false
	}
}

export function formatActivateState(notification: OutOfOfficeNotification | null): string {
	if (notification && notification.enabled) {
		var timeRange = ""

		if (notification.startDate) {
			timeRange += " (" + formatDate(notification.startDate)

			if (notification.endDate) {
				// end dates are stored as the beginning of the following date. We subtract one day to show the correct date to the user.
				const shiftedEndDate = getDayShifted(notification.endDate, -1)
				timeRange += " - " + formatDate(shiftedEndDate)
			}

			timeRange += ")"
		}

		return lang.get("activated_label") + timeRange
	} else {
		return lang.get("deactivated_label")
	}
}

/**
 *
 * @param organizationMessageEnabled true if a special messagesfor senders from the same organization is setup
 * @returns {string} the label for default notifications (depends on whether only default notifications or both default and same organization notifications are enabled)
 */
export function getDefaultNotificationLabel(organizationMessageEnabled: boolean): string {
	if (organizationMessageEnabled) {
		return lang.get("outOfOfficeExternal_msg")
	} else {
		return lang.get("outOfOfficeEveryone_msg")
	}
}

/**
 * Loads the out of office notification from the server and shifts the end date (from the first second of the following day to the first second of the last day)
 * which is needed to display the correct end date.
 */
export function loadOutOfOfficeNotification(): Promise<OutOfOfficeNotification | null> {
	const mailMembership = locator.logins.getUserController().getUserMailGroupMembership()
	return locator.entityClient.load(MailboxGroupRootTypeRef, mailMembership.group).then((grouproot) => {
		if (grouproot.outOfOfficeNotification) {
			return locator.entityClient.load<OutOfOfficeNotification>(OutOfOfficeNotificationTypeRef, grouproot.outOfOfficeNotification)
		} else {
			return null
		}
	})
}
