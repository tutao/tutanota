import type { OutOfOfficeNotification, OutOfOfficeNotificationMessage } from "../../common/api/entities/tutanota/TypeRefs.js"
import { createOutOfOfficeNotification, createOutOfOfficeNotificationMessage } from "../../common/api/entities/tutanota/TypeRefs.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { getDayShifted, getStartOfDay, getStartOfNextDay, ofClass } from "@tutao/tutanota-utils"
import { OutOfOfficeNotificationMessageType } from "../../common/api/common/TutanotaConstants"
import { InvalidDataError, PreconditionFailedError } from "../../common/api/common/error/RestError"
import type { EntityClient } from "../../common/api/common/EntityClient"
import type { LanguageViewModel } from "../../common/misc/LanguageViewModel"
import type { UserController } from "../../common/api/main/UserController"
import { appendEmailSignature } from "../mail/signature/Signature"
import { UserError } from "../../common/api/main/UserError"
import { UpgradeRequiredError } from "../../common/api/main/UpgradeRequiredError.js"
import { IServiceExecutor } from "../../common/api/common/ServiceRequest.js"

import { getAvailablePlansWithAutoResponder } from "../../common/subscription/SubscriptionUtils.js"

export const enum RecipientMessageType {
	EXTERNAL_TO_EVERYONE = 0,
	INTERNAL_AND_EXTERNAL = 1,
	INTERNAL_ONLY = 2,
}

const FAILURE_UPGRADE_REQUIRED = "outofoffice.not_available_on_current_plan"

export class EditOutOfOfficeNotificationDialogModel {
	outOfOfficeNotification: OutOfOfficeNotification
	enabled: Stream<boolean> = stream<boolean>(false)
	startDate: Stream<Date> = stream(new Date())
	endDate: Stream<Date> = stream(new Date())
	indefiniteTimeRange: Stream<boolean> = stream<boolean>(true)
	timeRangeEnabled: Stream<boolean> = stream<boolean>(false)
	organizationSubject: Stream<string> = stream("")
	organizationMessage: Stream<string> = stream("")
	defaultSubject: Stream<string> = stream("")
	defaultMessage: Stream<string> = stream("")
	recipientMessageTypes: Stream<RecipientMessageType> = stream<RecipientMessageType>(RecipientMessageType.EXTERNAL_TO_EVERYONE)
	_entityClient: EntityClient
	_userController: UserController
	_languageViewModel: LanguageViewModel

	constructor(
		outOfOfficeNotification: OutOfOfficeNotification | null,
		entityClient: EntityClient,
		userController: UserController,
		languageViewModel: LanguageViewModel,
		readonly serviceExecutor: IServiceExecutor,
	) {
		this._entityClient = entityClient
		this._userController = userController
		this._languageViewModel = languageViewModel

		this._setDefaultMessages()

		if (!outOfOfficeNotification) {
			this.startDate(getStartOfDay(new Date()))
			this.outOfOfficeNotification = createOutOfOfficeNotification({
				notifications: [],
				enabled: false,
				endDate: null,
				startDate: null,
			})
		} else {
			this.outOfOfficeNotification = outOfOfficeNotification
			this.enabled(outOfOfficeNotification.enabled)
			let defaultEnabled = false
			let organizationEnabled = false
			for (const notification of outOfOfficeNotification.notifications) {
				if (notification.type === OutOfOfficeNotificationMessageType.Default) {
					defaultEnabled = true
					this.defaultSubject(notification.subject)
					this.defaultMessage(notification.message)
				} else if (notification.type === OutOfOfficeNotificationMessageType.InsideOrganization) {
					organizationEnabled = true
					this.organizationSubject(notification.subject)
					this.organizationMessage(notification.message)
				}
			}

			if (defaultEnabled && organizationEnabled) {
				this.recipientMessageTypes(RecipientMessageType.INTERNAL_AND_EXTERNAL)
			} else if (organizationEnabled) {
				this.recipientMessageTypes(RecipientMessageType.INTERNAL_ONLY)
			} else {
				this.recipientMessageTypes(RecipientMessageType.EXTERNAL_TO_EVERYONE)
			}

			if (outOfOfficeNotification.startDate) {
				this.startDate(outOfOfficeNotification.startDate)
				this.timeRangeEnabled(true)

				// end dates are stored as the beginning of the following date. We subtract one day to show the correct date to the user.
				if (outOfOfficeNotification.endDate) {
					const shiftedEndDate = getDayShifted(outOfOfficeNotification.endDate, -1)
					this.endDate(shiftedEndDate)
					this.indefiniteTimeRange(false)
				} else {
					this.indefiniteTimeRange(true)
				}
			}
		}
	}

	_setDefaultMessages() {
		const templateSubject = this._languageViewModel.get("outOfOfficeDefaultSubject_msg")

		const templateMessage = appendEmailSignature(this._languageViewModel.get("outOfOfficeDefault_msg"), this._userController.props)
		this.organizationSubject(templateSubject)
		this.defaultSubject(templateSubject)
		this.defaultMessage(templateMessage)
		this.organizationMessage(templateMessage)
	}

	/**
	 * Return OutOfOfficeNotification created from input data.
	 * @throws UserError if time period is invalid
	 * */
	getNotificationFromData(): OutOfOfficeNotification {
		let startDate: Date | null = null
		let endDate: Date | null = null

		// We use the last second of the day as end time to make sure notifications are still send during this day.
		// We use the local time for date picking and convert it to UTC because the server expects utc dates
		if (this.timeRangeEnabled()) {
			startDate = this.startDate()

			if (!this.indefiniteTimeRange()) {
				endDate = getStartOfNextDay(this.endDate())

				if (startDate.getTime() > endDate.getTime() || endDate.getTime() < Date.now()) {
					throw new UserError("invalidTimePeriod_msg")
				}
			}
		}

		const notificationMessages: OutOfOfficeNotificationMessage[] = []

		if (this.isDefaultMessageEnabled()) {
			const defaultNotification: OutOfOfficeNotificationMessage = createOutOfOfficeNotificationMessage({
				subject: this.defaultSubject().trim(),
				message: this.defaultMessage().trim(),
				type: OutOfOfficeNotificationMessageType.Default,
			})
			notificationMessages.push(defaultNotification)
		}

		if (this.isOrganizationMessageEnabled()) {
			const organizationNotification: OutOfOfficeNotificationMessage = createOutOfOfficeNotificationMessage({
				subject: this.organizationSubject().trim(),
				message: this.organizationMessage().trim(),
				type: OutOfOfficeNotificationMessageType.InsideOrganization,
			})
			notificationMessages.push(organizationNotification)
		}

		this.outOfOfficeNotification._ownerGroup = this._userController.getUserMailGroupMembership().group
		this.outOfOfficeNotification.enabled = this.enabled()
		this.outOfOfficeNotification.startDate = startDate
		this.outOfOfficeNotification.endDate = endDate
		this.outOfOfficeNotification.notifications = notificationMessages
		return this.outOfOfficeNotification
	}

	isOrganizationMessageEnabled(): boolean {
		return (
			this.recipientMessageTypes() === RecipientMessageType.INTERNAL_ONLY || this.recipientMessageTypes() === RecipientMessageType.INTERNAL_AND_EXTERNAL
		)
	}

	isDefaultMessageEnabled(): boolean {
		return (
			this.recipientMessageTypes() === RecipientMessageType.EXTERNAL_TO_EVERYONE ||
			this.recipientMessageTypes() === RecipientMessageType.INTERNAL_AND_EXTERNAL
		)
	}

	/**
	 * @throws UserError
	 * @throws UpgradeRequiredError
	 */
	saveOutOfOfficeNotification(): Promise<any> {
		return Promise.resolve()
			.then(() => this.getNotificationFromData())
			.then(async (sendableNotification) => {
				// Error messages are already shown if sendableNotification is null. We do not close the dialog.
				if (this._isNewNotification()) {
					await this._entityClient.setup(null, sendableNotification)
				} else {
					await this._entityClient.update(sendableNotification)
				}
			})
			.catch(
				ofClass(InvalidDataError, (e) => {
					throw new UserError("outOfOfficeMessageInvalid_msg")
				}),
			)
			.catch(
				ofClass(PreconditionFailedError, async (e) => {
					if (e.data === FAILURE_UPGRADE_REQUIRED) {
						throw new UpgradeRequiredError("upgradeRequired_msg", await getAvailablePlansWithAutoResponder())
					} else {
						throw new UserError(() => e.toString())
					}
				}),
			)
	}

	_isNewNotification(): boolean {
		return !this.outOfOfficeNotification._id
	}
}
