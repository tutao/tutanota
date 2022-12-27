import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { getStartOfTheWeekOffsetForUser } from "../calendar/date/CalendarUtils"
import type { OutOfOfficeNotification } from "../api/entities/tutanota/TypeRefs.js"
import type { TextFieldAttrs } from "../gui/base/TextField.js"
import { TextField } from "../gui/base/TextField.js"
import { lang } from "../misc/LanguageViewModel"
import { Keys, OUT_OF_OFFICE_SUBJECT_PREFIX } from "../api/common/TutanotaConstants"
import type { CheckboxAttrs } from "../gui/base/Checkbox.js"
import { Checkbox } from "../gui/base/Checkbox.js"
import { px } from "../gui/size"
import { ButtonType } from "../gui/base/Button.js"
import { getDefaultNotificationLabel } from "../misc/OutOfOfficeNotificationUtils"
import { showBusinessFeatureRequiredDialog } from "../misc/SubscriptionDialogs"
import type { DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import { showUserError } from "../misc/ErrorHandlerImpl"
import { BusinessFeatureRequiredError } from "../api/main/BusinessFeatureRequiredError"
import { locator } from "../api/main/MainLocator"
import { logins } from "../api/main/LoginController"
import { EditOutOfOfficeNotificationDialogModel, RecipientMessageType } from "./EditOutOfOfficeNotificationDialogModel"
import { HtmlEditor } from "../gui/editor/HtmlEditor"
import { UserError } from "../api/main/UserError"
import { DatePicker } from "../gui/date/DatePicker"
import type { lazy } from "@tutao/tutanota-utils"
import { ofClass } from "@tutao/tutanota-utils"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"

export function showEditOutOfOfficeNotificationDialog(outOfOfficeNotification: OutOfOfficeNotification | null) {
	const dialogModel = new EditOutOfOfficeNotificationDialogModel(outOfOfficeNotification, locator.entityClient, logins.getUserController(), lang)
	const organizationMessageEditor = new HtmlEditor("message_label")
		.setMinHeight(100)
		.showBorders()
		.setValue(dialogModel.organizationMessage())
		.enableToolbar()
	const defaultMessageEditor = new HtmlEditor("message_label").setMinHeight(100).showBorders().setValue(dialogModel.defaultMessage()).enableToolbar()

	const saveOutOfOfficeNotification = () => {
		dialogModel.organizationMessage(organizationMessageEditor.getValue())
		dialogModel.defaultMessage(defaultMessageEditor.getValue())
		dialogModel
			.saveOutOfOfficeNotification()
			.then(() => cancel())
			.catch(ofClass(UserError, (e) => showUserError(e)))
			.catch(ofClass(BusinessFeatureRequiredError, (e) => showBusinessFeatureRequiredDialog(() => e.message)))
	}

	function cancel() {
		dialog.close()
	}

	const dialogHeaderAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: cancel,
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "save_action",
				click: saveOutOfOfficeNotification,
				type: ButtonType.Primary,
			},
		],
		middle: () => lang.get("outOfOfficeNotification_title"),
	}
	const dialog = Dialog.largeDialogN(dialogHeaderAttrs, EditOutOfOfficeNotificationDialog, {
		model: dialogModel,
		organizationMessageEditor,
		defaultMessageEditor,
	})
		.addShortcut({
			key: Keys.ESC,
			exec: cancel,
			help: "close_alt",
		})
		.addShortcut({
			key: Keys.S,
			ctrl: true,
			exec: saveOutOfOfficeNotification,
			help: "save_action",
		})
	dialog.show()
}

type EditOutOfOfficeNotificationDialogAttrs = {
	model: EditOutOfOfficeNotificationDialogModel
	defaultMessageEditor: HtmlEditor
	organizationMessageEditor: HtmlEditor
}

class EditOutOfOfficeNotificationDialog implements Component<EditOutOfOfficeNotificationDialogAttrs> {
	view(vnode: Vnode<EditOutOfOfficeNotificationDialogAttrs>): Children {
		const { model, defaultMessageEditor, organizationMessageEditor } = vnode.attrs
		const defaultEnabled = model.isDefaultMessageEnabled()
		const organizationEnabled = model.isOrganizationMessageEnabled()
		const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot)
		return [
			this.renderEnabled(model),
			this.renderRecipients(model),
			m(
				".mt.flex-start",
				m(Checkbox, {
					label: () => lang.get("outOfOfficeTimeRange_msg"),
					checked: model.timeRangeEnabled(),
					onChecked: model.timeRangeEnabled,
					helpLabel: () => lang.get("outOfOfficeTimeRangeHelp_msg"),
				}),
			),
			model.timeRangeEnabled() ? this.renderTimeRangeSelector(model, startOfTheWeekOffset) : null,
			m(".mt-l", lang.get("outOfOfficeUnencrypted_msg")),
			organizationEnabled ? this.renderOrganizations(model, organizationMessageEditor) : null,
			defaultEnabled ? this.renderDefault(organizationEnabled, model, defaultMessageEditor) : null,
			m(".pb", ""),
		]
	}

	private renderEnabled(model: EditOutOfOfficeNotificationDialogModel) {
		const statusItems = [
			{ name: lang.get("deactivated_label"), value: false },
			{ name: lang.get("activated_label"), value: true },
		]
		return m(DropDownSelector, {
			label: "state_label",
			items: statusItems,
			selectedValue: model.enabled(),
			selectionChangedHandler: model.enabled,
		})
	}

	private renderDefault(organizationEnabled: boolean, model: EditOutOfOfficeNotificationDialogModel, defaultMessageEditor: HtmlEditor) {
		return [
			m(".h4.text-center.mt-l", getDefaultNotificationLabel(organizationEnabled)),
			m(TextField, {
				label: "subject_label",
				value: model.defaultSubject(),
				oninput: model.defaultSubject,
				injectionsLeft: () =>
					m(
						".flex-no-grow-no-shrink-auto.pr-s",
						{
							style: {
								"line-height": px(24),
								opacity: "1",
							},
						},
						OUT_OF_OFFICE_SUBJECT_PREFIX,
					),
			}),
			m(defaultMessageEditor),
		]
	}

	private renderOrganizations(model: EditOutOfOfficeNotificationDialogModel, organizationMessageEditor: HtmlEditor) {
		return [
			m(".h4.text-center.mt-l", lang.get("outOfOfficeInternal_msg")),
			m(TextField, {
				label: "subject_label",
				value: model.organizationSubject(),
				oninput: model.organizationSubject,
				injectionsLeft: () =>
					m(
						".flex-no-grow-no-shrink-auto.pr-s",
						{
							style: {
								"line-height": px(24),
								opacity: "1",
							},
						},
						OUT_OF_OFFICE_SUBJECT_PREFIX,
					),
			}),
			m(organizationMessageEditor),
		]
	}

	private renderRecipients(model: EditOutOfOfficeNotificationDialogModel) {
		const recipientItems = [
			{ name: lang.get("everyone_label"), value: RecipientMessageType.EXTERNAL_TO_EVERYONE },
			{ name: lang.get("insideOutside_label"), value: RecipientMessageType.INTERNAL_AND_EXTERNAL },
			{ name: lang.get("insideOnly_label"), value: RecipientMessageType.INTERNAL_ONLY },
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

		return m(DropDownSelector, {
			label: "outOfOfficeRecipients_label",
			items: recipientItems,
			selectedValue: model.recipientMessageTypes(),
			selectionChangedHandler: model.recipientMessageTypes,
			helpLabel: recipientHelpLabel,
		})
	}

	private renderTimeRangeSelector(model: EditOutOfOfficeNotificationDialogModel, startOfTheWeekOffset: number): Children {
		return m(".flex.col", [
			m(DatePicker, {
				date: model.startDate(),
				onDateSelected: model.startDate,
				label: "dateFrom_label",
				nullSelectionText: "emptyString_msg",
				startOfTheWeekOffset,
			}),
			m(Checkbox, {
				label: () => lang.get("unlimited_label"),
				checked: model.indefiniteTimeRange(),
				onChecked: model.indefiniteTimeRange,
			}),
			!model.indefiniteTimeRange()
				? m(DatePicker, {
						date: model.endDate(),
						onDateSelected: model.endDate,
						label: "dateTo_label",
						nullSelectionText: "emptyString_msg",
						startOfTheWeekOffset,
				  })
				: null,
		])
	}
}
