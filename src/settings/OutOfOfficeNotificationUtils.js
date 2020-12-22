//@flow
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import {OutOfOfficeNotificationTypeRef} from "../api/entities/tutanota/OutOfOfficeNotification"
import {formatDate} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import type {OutOfOfficeNotificationMessage} from "../api/entities/tutanota/OutOfOfficeNotificationMessage"
import {locator} from "../api/main/MainLocator"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import type {GroupMembership} from "../api/entities/sys/GroupMembership"
import {logins} from "../api/main/LoginController"
import {OUT_OF_OFFICE_MESSAGE_MAX_LENGTH, OUT_OF_OFFICE_SUBJECT_MAX_LENGTH} from "../api/common/TutanotaConstants"

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

export function formatActivateState(notification: OutOfOfficeNotification): string {
	if (notification.enabled) {
		var timeRange = ""
		if (notification.startDate) {
			timeRange += " (" + formatDate(notification.startDate)
			if (notification.endDate) {
				timeRange += " - " + formatDate(notification.endDate)
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
 * @param messages
 * @returns {boolean} true if messages is a valid array of notification messages (at least one message)
 */
export function notificationMessagesAreValid(messages: OutOfOfficeNotificationMessage[]): boolean {
	if (messages.length < 1 || messages.length > 2) {
		return false
	}
	let result = true
	messages.forEach((message) => {
		if (message.subject.length === 0
			|| message.message.length === 0
			|| message.message === "<div><br></div>" // TODO proper check
			|| message.subject.length > OUT_OF_OFFICE_SUBJECT_MAX_LENGTH
			|| message.message.length > OUT_OF_OFFICE_MESSAGE_MAX_LENGTH) {
			result = false
		}
	})
	return result
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

export function getMailMembership(): GroupMembership {
	return logins.getUserController().getUserMailGroupMembership()
}

export function loadOutOfOfficeNotification(): Promise<?OutOfOfficeNotification> {
	const mailMembership = getMailMembership()
	return locator.entityClient.load(MailboxGroupRootTypeRef, mailMembership.group).then((grouproot) => {
		if (grouproot.outOfOfficeNotification) {
			return locator.entityClient.load(OutOfOfficeNotificationTypeRef, grouproot.outOfOfficeNotification)
		}
	})
}