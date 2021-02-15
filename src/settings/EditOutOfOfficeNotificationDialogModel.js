//@flow
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification";
import {createOutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification";
import stream from "mithril/stream/stream.js"
import {getDayShifted, getStartOfDay, getStartOfNextDay} from "../api/common/utils/DateUtils";
import {OutOfOfficeNotificationMessageType} from "../api/common/TutanotaConstants";
import type {OutOfOfficeNotificationMessage} from "../api/entities/tutanota/OutOfOfficeNotificationMessage";
import {createOutOfOfficeNotificationMessage} from "../api/entities/tutanota/OutOfOfficeNotificationMessage";
import {InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError";
import {BusinessFeatureRequiredError} from "../api/main/BusinessFeatureRequiredError";
import type {EntityClient} from "../api/common/EntityClient"
import type {LanguageViewModel} from "../misc/LanguageViewModel"
import type {IUserController} from "../api/main/UserController"
import {appendEmailSignature} from "../mail/signature/Signature"
import {UserError} from "../api/main/UserError"

export const RecipientMessageType = Object.freeze({
	EXTERNAL_TO_EVERYONE: 0,
	INTERNAL_AND_EXTERNAL: 1,
	INTERNAL_ONLY: 2
})
export type RecipientMessageTypeEnum = $Values<typeof RecipientMessageType>;
const FAILURE_BUSINESS_FEATURE_REQUIRED = "outofoffice.business_feature_required"

export class EditOutOfOfficeNotificationDialogModel {
	outOfOfficeNotification: OutOfOfficeNotification

	enabled: Stream<boolean>
	startDate: Stream<?Date>
	endDate: Stream<?Date>
	organizationSubject: Stream<string>
	organizationMessage: Stream<string>
	defaultSubject: Stream<string>
	defaultMessage: Stream<string>

	timeRangeEnabled: Stream<boolean> = stream(false)
	recipientMessageTypes: Stream<RecipientMessageTypeEnum> = stream(RecipientMessageType.EXTERNAL_TO_EVERYONE)
	_entityClient: EntityClient
	_userController: IUserController
	_languageViewModel: LanguageViewModel


	constructor(outOfOfficeNotification: ?OutOfOfficeNotification, entityClient: EntityClient, userController: IUserController, languageViewModel: LanguageViewModel) {
		this._entityClient = entityClient
		this._userController = userController
		this._languageViewModel = languageViewModel
		this.enabled = stream(false)
		this.startDate = stream(null)
		this.endDate = stream(null)
		this.organizationSubject = stream("")
		this.organizationMessage = stream("")
		this.defaultSubject = stream("")
		this.defaultMessage = stream("")

		this._setDefaultMessages()
		if (!outOfOfficeNotification) {
			this.startDate(getStartOfDay(new Date()))
			this.outOfOfficeNotification = createOutOfOfficeNotification()
		} else {
			this.outOfOfficeNotification = outOfOfficeNotification
			this.enabled(outOfOfficeNotification.enabled)
			let defaultEnabled = false
			let organizationEnabled = false
			outOfOfficeNotification.notifications.forEach((notification) => {
				if (notification.type === OutOfOfficeNotificationMessageType.Default) {
					defaultEnabled = true
					this.defaultSubject(notification.subject)
					this.defaultMessage(notification.message)
				} else if (notification.type === OutOfOfficeNotificationMessageType.InsideOrganization) {
					organizationEnabled = true
					this.organizationSubject(notification.subject)
					this.organizationMessage(notification.message)
				}
			})
			if (defaultEnabled && organizationEnabled) {
				this.recipientMessageTypes(RecipientMessageType.INTERNAL_AND_EXTERNAL)
			} else if (organizationEnabled) {
				this.recipientMessageTypes(RecipientMessageType.INTERNAL_ONLY)
			} else {
				this.recipientMessageTypes(RecipientMessageType.EXTERNAL_TO_EVERYONE)
			}
			if (outOfOfficeNotification.startDate) {
				this.timeRangeEnabled(true)
				this.startDate(outOfOfficeNotification.startDate)

				// end dates are stored as the beginning of the following date. We substract one day to show the correct date to the user.
				const shiftedEndDate = outOfOfficeNotification.endDate ? getDayShifted(outOfOfficeNotification.endDate, -1) : null
				this.endDate(shiftedEndDate)
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
		let startDate: ?Date = null
		let endDate: ?Date = null
		// We use the last second of the day as end time to make sure notifications are still send during this day.
		// We use the local time for date picking and convert it to UTC because the server expects utc dates
		if (this.timeRangeEnabled()) {
			startDate = this.startDate()
			endDate = this.endDate()
			if (endDate) {
				endDate = getStartOfNextDay(endDate)
			}
			if (!startDate || (endDate && (startDate.getTime() > endDate.getTime() || endDate.getTime() < Date.now()))) {
				throw new UserError("invalidTimePeriod_msg")
			}
		}

		const notificationMessages: OutOfOfficeNotificationMessage[] = []
		if (this.isDefaultMessageEnabled()) {
			const defaultNotification: OutOfOfficeNotificationMessage = createOutOfOfficeNotificationMessage({
				subject: this.defaultSubject().trim(),
				message: this.defaultMessage().trim(),
				type: OutOfOfficeNotificationMessageType.Default
			})
			notificationMessages.push(defaultNotification)
		}
		if (this.isOrganizationMessageEnabled()) {
			const organizationNotification: OutOfOfficeNotificationMessage = createOutOfOfficeNotificationMessage({
				subject: this.organizationSubject().trim(),
				message: this.organizationMessage().trim(),
				type: OutOfOfficeNotificationMessageType.InsideOrganization
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
		return this.recipientMessageTypes() === RecipientMessageType.INTERNAL_ONLY
			|| this.recipientMessageTypes() === RecipientMessageType.INTERNAL_AND_EXTERNAL
	}

	isDefaultMessageEnabled(): boolean {
		return this.recipientMessageTypes() === RecipientMessageType.EXTERNAL_TO_EVERYONE
			|| this.recipientMessageTypes() === RecipientMessageType.INTERNAL_AND_EXTERNAL
	}

	/**
	 * throws UserError
	 * throw Busines
	 */
	saveOutOfOfficeNotification(): Promise<void> {
		return Promise.resolve()
		              .then(() => this.getNotificationFromData())
		              .then(sendableNotification => {

			              // Error messages are already shown if sendableNotification is null. We do not close the dialog.
			              return this._isNewNotification()
				              ? this._entityClient.setup(null, sendableNotification)
				              : this._entityClient.update(sendableNotification)
		              })
		              .catch(InvalidDataError, e => {
			              throw new UserError("outOfOfficeMessageInvalid_msg")
		              })
		              .catch(PreconditionFailedError, e => {
			              if (e.data === FAILURE_BUSINESS_FEATURE_REQUIRED) {
				              throw new BusinessFeatureRequiredError("businessFeatureRequiredGeneral_msg")
			              } else {
				              throw new UserError(() => e.toString())
			              }
		              })
	}

	_isNewNotification(): boolean {
		return !this.outOfOfficeNotification._id
	}

}