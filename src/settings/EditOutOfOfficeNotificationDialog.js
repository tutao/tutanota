// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {getStartOfTheWeekOffsetForUser} from "../calendar/date/CalendarUtils"
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {lang} from "../misc/LanguageViewModel"
import {Keys, OUT_OF_OFFICE_SUBJECT_PREFIX} from "../api/common/TutanotaConstants"
import type {CheckboxAttrs} from "../gui/base/CheckboxN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {px} from "../gui/size"
import {ButtonType} from "../gui/base/ButtonN"
import {getDefaultNotificationLabel} from "../api/main/OutOfOfficeNotificationUtils"
import {showBusinessFeatureRequiredDialog} from "../misc/SubscriptionDialogs"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {showUserError} from "../misc/ErrorHandlerImpl"
import {BusinessFeatureRequiredError} from "../api/main/BusinessFeatureRequiredError"
import {locator} from "../api/main/MainLocator"
import {logins} from "../api/main/LoginController"
import type {RecipientMessageTypeEnum} from "./EditOutOfOfficeNotificationDialogModel"
import {EditOutOfOfficeNotificationDialogModel, RecipientMessageType} from "./EditOutOfOfficeNotificationDialogModel"
import {HtmlEditor} from "../gui/editor/HtmlEditor"
import {UserError} from "../api/main/UserError"
import {DatePicker} from "../gui/date/DatePicker"

export function showEditOutOfOfficeNotificationDialog(outOfOfficeNotification: ?OutOfOfficeNotification) {
	const dialogModel = new EditOutOfOfficeNotificationDialogModel(outOfOfficeNotification, locator.entityClient, logins.getUserController(), lang)

	const organizationMessageEditor = new HtmlEditor("message_label", {enabled: true})
		.setMinHeight(100)
		.showBorders()
		.setValue(dialogModel.organizationMessage())
	const defaultMessageEditor = new HtmlEditor("message_label", {enabled: true})
		.setMinHeight(100)
		.showBorders()
		.setValue(dialogModel.defaultMessage())

	const saveOutOfOfficeNotification = () => {
		dialogModel.organizationMessage(organizationMessageEditor.getValue())
		dialogModel.defaultMessage(defaultMessageEditor.getValue())
		dialogModel.saveOutOfOfficeNotification()
		           .then(() => cancel())
		           .catch(UserError, e => showUserError(e))
		           .catch(BusinessFeatureRequiredError, (e) => showBusinessFeatureRequiredDialog(() => e.message))
	}

	function cancel() {
		dialog.close()
	}

	const dialogHeaderAttrs = {
		left: [{label: "cancel_action", click: cancel, type: ButtonType.Secondary}],
		right: [{label: "save_action", click: saveOutOfOfficeNotification, type: ButtonType.Primary}],
		middle: () => lang.get("outOfOfficeNotification_title"),
	}
	const dialog = Dialog.largeDialogN(dialogHeaderAttrs, EditoOutOfOfficeNotificationDialog, {
		model: dialogModel,
		organizationMessageEditor,
		defaultMessageEditor
	}).addShortcut({
		key: Keys.ESC,
		exec: cancel,
		help: "close_alt"
	}).addShortcut({
		key: Keys.S,
		ctrl: true,
		exec: saveOutOfOfficeNotification,
		help: "save_action"
	})
	dialog.show()

}


type EditoOutOfOfficeNotificationDialogAttrs = {|
	model: EditOutOfOfficeNotificationDialogModel,
	defaultMessageEditor: HtmlEditor,
	organizationMessageEditor: HtmlEditor,
|}

class EditoOutOfOfficeNotificationDialog implements MComponent<EditoOutOfOfficeNotificationDialogAttrs> {
	_statusSelectorAttrs: DropDownSelectorAttrs<boolean>
	_recipientSelectorAttrs: DropDownSelectorAttrs<RecipientMessageTypeEnum>
	_timeRangeCheckboxAttrs: CheckboxAttrs
	_defaultSubjectAttrs: TextFieldAttrs
	_organizationSubjectAttrs: TextFieldAttrs
	_startDatePicker: DatePicker
	_endDatePicker: DatePicker

	constructor(vnode: Vnode<EditoOutOfOfficeNotificationDialogAttrs>) {
		const {model} = vnode.attrs
		const startOfWeek = getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot)
		this._startDatePicker = new DatePicker(startOfWeek, "dateFrom_label", "emptyString_msg", false, model.startDate)
		this._endDatePicker = new DatePicker(startOfWeek, "dateTo_label", "emptyString_msg", false, model.endDate)

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
		this._statusSelectorAttrs = {
			label: "state_label",
			items: statusItems,
			selectedValue: model.enabled,
		}

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
		const recipientHelpLabel: lazy<string> = () => {
			switch (model.recipientMessageTypes()) {
				case RecipientMessageType.EXTERNAL_TO_EVERYONE:
					return lang.get("outOfOfficeRecipientsEveryoneHelp_label")
				case RecipientMessageType.INTERNAL_AND_EXTERNAL:
					return lang.get("outOfOfficeRecipientsInternalExternalHelp_label")
				case RecipientMessageType.INTERNAL_ONLY:
					return lang.get("outOfOfficeRecipientsInternalOnlyHelp_label")
				default:
					return ""
			}
		}

		this._recipientSelectorAttrs = {
			label: "outOfOfficeRecipients_label",
			items: recipientItems,
			selectedValue: model.recipientMessageTypes,
			helpLabel: recipientHelpLabel
		}

		this._timeRangeCheckboxAttrs = {
			label: () => lang.get("outOfOfficeTimeRange_msg"),
			checked: model.timeRangeEnabled,
			helpLabel: () => lang.get("outOfOfficeTimeRangeHelp_msg"),
		}

		this._defaultSubjectAttrs = {
			label: "subject_label",
			value: model.defaultSubject,
			injectionsLeft: () => m(".flex-no-grow-no-shrink-auto.pr-s", {
				style: {
					'line-height': px(24),
					opacity: '1'
				}
			}, OUT_OF_OFFICE_SUBJECT_PREFIX)
		}

		this._organizationSubjectAttrs = {
			label: "subject_label",
			value: model.organizationSubject,
			injectionsLeft: () => m(".flex-no-grow-no-shrink-auto.pr-s", {
				style: {
					'line-height': px(24),
					opacity: '1'
				}
			}, OUT_OF_OFFICE_SUBJECT_PREFIX)
		}
	}

	view(vnode: Vnode<EditoOutOfOfficeNotificationDialogAttrs>): Children {
		const {model, defaultMessageEditor, organizationMessageEditor} = vnode.attrs
		const defaultEnabled = model.isDefaultMessageEnabled()
		const organizationEnabled = model.isOrganizationMessageEnabled()
		return [
			m(DropDownSelectorN, this._statusSelectorAttrs),
			m(DropDownSelectorN, this._recipientSelectorAttrs),
			m(".mt.flex-start", m(CheckboxN, this._timeRangeCheckboxAttrs)),
			model.timeRangeEnabled()
				? m(".flex-start", [
					m(this._startDatePicker), m(this._endDatePicker)
				])
				: null,
			m(".mt-l", lang.get("outOfOfficeUnencrypted_msg",)),
			organizationEnabled
				? [
					m(".h4.text-center.mt-l", lang.get("outOfOfficeInternal_msg")),
					m(TextFieldN, this._organizationSubjectAttrs
					),
					m(organizationMessageEditor)
				]
				: null,
			defaultEnabled
				? [
					m(".h4.text-center.mt-l", getDefaultNotificationLabel(organizationEnabled)),
					m(TextFieldN, this._defaultSubjectAttrs),
					m(defaultMessageEditor)
				]
				: null,
			m(".pb", "")
		]
	}
}






