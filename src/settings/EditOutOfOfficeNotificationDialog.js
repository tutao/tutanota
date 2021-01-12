// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {DatePicker} from "../gui/base/DatePicker"
import {getStartOfTheWeekOffsetForUser} from "../calendar/CalendarUtils"
import {HtmlEditor} from "../gui/base/HtmlEditor"
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import {createOutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import type {GroupMembership} from "../api/entities/sys/GroupMembership"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {lang} from "../misc/LanguageViewModel"
import {locator} from "../api/main/MainLocator"
import {EmailSignatureType, Keys, OUT_OF_OFFICE_SUBJECT_PREFIX, OutOfOfficeNotificationMessageType} from "../api/common/TutanotaConstants"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import type {CheckboxAttrs} from "../gui/base/CheckboxN"
import {CheckboxN} from "../gui/base/CheckboxN"
import type {OutOfOfficeNotificationMessage} from "../api/entities/tutanota/OutOfOfficeNotificationMessage"
import {createOutOfOfficeNotificationMessage} from "../api/entities/tutanota/OutOfOfficeNotificationMessage"
import {px} from "../gui/size"
import {ButtonType} from "../gui/base/ButtonN"
import {getDayShifted, getStartOfDay, getStartOfNextDay} from "../api/common/utils/DateUtils"
import {getDefaultNotificationLabel, getMailMembership, notificationMessagesAreValid} from "./OutOfOfficeNotificationUtils"
import {logins} from "../api/main/LoginController"
import {getDefaultSignature} from "../mail/MailUtils"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {showBusinessFeatureRequiredDialog} from "../subscription/SubscriptionDialogUtils"

const RecipientMessageType = Object.freeze({
	EXTERNAL_TO_EVERYONE: 0,
	INTERNAL_AND_EXTERNAL: 1,
	INTERNAL_ONLY: 2
})
type RecipientMessageTypeEnum = $Values<typeof RecipientMessageType>;

const FAILURE_BUSINESS_FEATURE_REQUIRED = "outofoffice.business_feature_required"

class NotificationData {
	outOfOfficeNotification: OutOfOfficeNotification
	mailMembership: GroupMembership
	enabled: Stream<boolean>
	startDatePicker: DatePicker
	endDatePicker: DatePicker
	organizationSubject: Stream<string>
	defaultSubject: Stream<string>
	organizationOutOfOfficeEditor: HtmlEditor
	defaultOutOfOfficeEditor: HtmlEditor
	timeRangeEnabled: Stream<boolean> = stream(false)
	recipientMessageTypes: Stream<RecipientMessageTypeEnum> = stream(RecipientMessageType.EXTERNAL_TO_EVERYONE)

	constructor(outOfOfficeNotification: ?OutOfOfficeNotification) {
		this.mailMembership = getMailMembership()
		this.enabled = stream(false)
		this.startDatePicker = new DatePicker(getStartOfTheWeekOffsetForUser(), "dateFrom_label")
		this.endDatePicker = new DatePicker(getStartOfTheWeekOffsetForUser(), "dateTo_label")
		this.organizationSubject = stream("")
		this.defaultSubject = stream("")
		this.organizationOutOfOfficeEditor = new HtmlEditor("message_label", {enabled: true})
			.setMinHeight(100)
			.showBorders()
		this.defaultOutOfOfficeEditor = new HtmlEditor("message_label", {enabled: true})
			.setMinHeight(100)
			.showBorders()
		this._setDefaultMessages()
		if (!outOfOfficeNotification) {
			this.startDatePicker.setDate(getStartOfDay(new Date()))
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
					this.defaultOutOfOfficeEditor.setValue(notification.message)
				} else if (notification.type === OutOfOfficeNotificationMessageType.InsideOrganization) {
					organizationEnabled = true
					this.organizationSubject(notification.subject)
					this.organizationOutOfOfficeEditor.setValue(notification.message)
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
				this.startDatePicker.setDate(outOfOfficeNotification.startDate)

				// end dates are stored as the beginning of the following date. We substract one day to show the correct date to the user.
				const shiftedEndDate = outOfOfficeNotification.endDate ? getDayShifted(outOfOfficeNotification.endDate, -1) : null
				this.endDatePicker.setDate(shiftedEndDate)
			}
		}
	}

	_setDefaultMessages() {
		const templateSubject = lang.get("outOfOfficeDefaultSubject_msg")
		const props = logins.getUserController().props
		let signature = ""
		if (props.emailSignatureType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
			signature = props.customEmailSignature
		} else if (props.emailSignatureType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT) {
			signature = getDefaultSignature()
		}
		let templateMessage = lang.get("outOfOfficeDefault_msg")
		if (signature.length) {
			templateMessage = `${templateMessage}\n<br>${signature}`
		}
		this.organizationSubject(templateSubject)
		this.defaultSubject(templateSubject)
		this.defaultOutOfOfficeEditor.setValue(templateMessage)
		this.organizationOutOfOfficeEditor.setValue(templateMessage)
	}

	/**
	 * Return OutOfOfficeNotification created from input data or null if invalid.
	 * Shows error dialogs if invalid.
	 * */
	getNotificationFromData(): ?OutOfOfficeNotification {
		let startDate: ?Date = null
		let endDate: ?Date = null
		// We use the last second of the day as end time to make sure notifications are still send during this day.
		// We use the local time for date picking and convert it to UTC because the server expects utc dates
		if (this.timeRangeEnabled()) {
			startDate = this.startDatePicker.date()
			endDate = this.endDatePicker.date()
			if (endDate) {
				endDate = getStartOfNextDay(endDate)
			}
			if (!startDate || (endDate && (startDate.getTime() > endDate.getTime() || endDate.getTime() < Date.now()))) {
				Dialog.error("invalidTimePeriod_msg")
				return null
			}
		}

		const notificationMessages: OutOfOfficeNotificationMessage[] = []
		if (this.isDefaultMessageEnabled()) {
			const defaultNotification: OutOfOfficeNotificationMessage = createOutOfOfficeNotificationMessage({
				subject: this.defaultSubject(),
				message: this.defaultOutOfOfficeEditor.getValue(),
				type: OutOfOfficeNotificationMessageType.Default
			})
			notificationMessages.push(defaultNotification)
		}
		if (this.isOrganizationMessageEnabled()) {
			const organizationNotification: OutOfOfficeNotificationMessage = createOutOfOfficeNotificationMessage({
				subject: this.organizationSubject(),
				message: this.organizationOutOfOfficeEditor.getValue(),
				type: OutOfOfficeNotificationMessageType.InsideOrganization
			})
			notificationMessages.push(organizationNotification)
		}
		if (!notificationMessagesAreValid(notificationMessages)) {
			Dialog.error("outOfOfficeMessageInvalid_msg")
			return null
		}
		this.outOfOfficeNotification._ownerGroup = this.mailMembership.group
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

}

export function showEditOutOfOfficeNotificationDialog(outOfOfficeNotification: ?OutOfOfficeNotification) {
	const notificationData = new NotificationData(outOfOfficeNotification)
	const statusItems = [
		{
			name: lang.get("deactivated_label"),
			value: false
		},
		{
			name: lang.get("activated_label"),
			value: true
		}
	]
	const recipientItems = [
		{
			name: lang.get("everyone_label"),
			value: RecipientMessageType.EXTERNAL_TO_EVERYONE
		},
		{
			name: lang.get("insideOutside_label"),
			value: RecipientMessageType.INTERNAL_AND_EXTERNAL
		},
		{
			name: lang.get("insideOnly_label"),
			value: RecipientMessageType.INTERNAL_ONLY
		}
	]
	const recipientHelpLabel: lazy<string> = () => lang.get("outOfOfficeRecipientsHelp_label")
	const statusSelector: DropDownSelector<boolean> = new DropDownSelector("state_label", null, statusItems, notificationData.enabled)
	const recipientSelector: DropDownSelector<RecipientMessageTypeEnum> = new DropDownSelector("outOfOfficeRecipients_label", recipientHelpLabel, recipientItems, notificationData.recipientMessageTypes)
	const timeRangeCheckboxAttrs: CheckboxAttrs = {
		label: () => lang.get("outOfOfficeTimeRange_msg"),
		checked: notificationData.timeRangeEnabled,
		helpLabel: () => lang.get("outOfOfficeTimeRangeHelp_msg"),
	}

	const childForm = {
		view: () => {
			const defaultEnabled = notificationData.isDefaultMessageEnabled()
			const organizationEnabled = notificationData.isOrganizationMessageEnabled()
			return [
				m(statusSelector),
				m(recipientSelector),
				m(".mt.flex-start", m(CheckboxN, timeRangeCheckboxAttrs)),
				notificationData.timeRangeEnabled()
					? m(".flex-start", [
						m(notificationData.startDatePicker), m(notificationData.endDatePicker)
					])
					: null,
				m(".mt-l", lang.get("outOfOfficeUnencrypted_msg",)),
				defaultEnabled
					? [
						m(".h4.text-center.mt-l", getDefaultNotificationLabel(organizationEnabled)),
						m(TextFieldN, {
								label: "subject_label",
								value: notificationData.defaultSubject,
								injectionsLeft: () => m(".flex-no-grow-no-shrink-auto.pr-s", {
									style: {
										'line-height': px(24),
										opacity: '1'
									}
								}, OUT_OF_OFFICE_SUBJECT_PREFIX)
							}
						),
						m(notificationData.defaultOutOfOfficeEditor)
					]
					: null,
				organizationEnabled
					? [
						m(".h4.text-center.mt-l", lang.get("outOfOfficeInternal_msg")),
						m(TextFieldN, {
								label: "subject_label",
								value: notificationData.organizationSubject,
								injectionsLeft: () => m(".flex-no-grow-no-shrink-auto.pr-s", {
									style: {
										'line-height': px(24),
										opacity: '1'
									}
								}, OUT_OF_OFFICE_SUBJECT_PREFIX)
							}
						),
						m(notificationData.organizationOutOfOfficeEditor)
					]
					: null,
				m(".pb", "")
			]
		}
	}

	const saveOutOfOfficeNotification = () => {
		const sendableNotification = notificationData.getNotificationFromData()
		// Error messages are already shown if sendableNotification is null. We do not close the dialog.
		if (sendableNotification) {
			const requestPromise = outOfOfficeNotification
				? locator.entityClient.update(sendableNotification)
				: locator.entityClient.setup(null, sendableNotification)
			// If the request fails the user should have to close manually. Otherwise the input data would be lost.
			requestPromise.then(() => cancel())
			              .catch(PreconditionFailedError, e => {
				              if (e.data === FAILURE_BUSINESS_FEATURE_REQUIRED) {
					              return showBusinessFeatureRequiredDialog("businessFeatureRequiredGeneral_msg")
				              } else {
					              return Dialog.error(() => e.toString())
				              }
			              })
		}
	}

	function cancel() {
		dialog.close()
	}

	const dialogHeaderAttrs = {
		left: [{label: "cancel_action", click: cancel, type: ButtonType.Secondary}],
		right: [{label: "ok_action", click: saveOutOfOfficeNotification, type: ButtonType.Primary}],
		middle: () => lang.get("outOfOfficeNotification_title"),
	}
	const dialog = Dialog.largeDialog(dialogHeaderAttrs, childForm).addShortcut({
		key: Keys.ESC,
		exec: cancel,
		help: "close_alt"
	}).addShortcut({
		key: Keys.S,
		ctrl: true,
		exec: saveOutOfOfficeNotification,
		help: "ok_action"
	})
	dialog.show()
}









